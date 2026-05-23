import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Tenant } from '../database/entities/tenant.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { TenantsService } from '../tenants/tenants.service';
import { CheckoutDto } from './dto/checkout.dto';
import { PlanId } from '../config/plans';

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(
    @InjectRepository(Tenant) private tenantsRepo: Repository<Tenant>,
    @InjectRepository(Subscription) private subsRepo: Repository<Subscription>,
    private tenantsService: TenantsService,
    private config: ConfigService,
  ) {}

  private getStripe(): Stripe {
    if (!this.stripe) {
      const secretKey = this.config.get<string>('stripe.secretKey');
      if (!secretKey) {
        throw new BadRequestException(
          'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.',
        );
      }
      this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
    }
    return this.stripe;
  }

  async getSubscription(tenantId: string) {
    const tenant = await this.tenantsService.getMe(tenantId);
    const sub = await this.subsRepo.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return {
      plan: tenant.plan,
      subscription: sub
        ? {
            status: sub.status,
            priceId: sub.priceId,
            currentPeriodEnd: sub.currentPeriodEnd,
            stripeSubscriptionId: sub.stripeSubscriptionId,
          }
        : null,
    };
  }

  async createCheckout(tenantId: string, userEmail: string, dto: CheckoutDto) {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const priceId = dto.priceId ?? this.resolvePriceId(dto.plan ?? 'starter');
    if (!priceId) {
      throw new BadRequestException('Stripe price not configured');
    }

    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await this.getStripe().customers.create({
        email: userEmail,
        metadata: { tenantId },
      });
      customerId = customer.id;
      await this.tenantsService.updateStripeCustomer(tenantId, customerId);
    }

    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const session = await this.getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing?checkout=success`,
      cancel_url: `${frontendUrl}/billing?checkout=canceled`,
      metadata: { tenantId },
      subscription_data: { metadata: { tenantId } },
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPortal(tenantId: string) {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer. Subscribe first.');
    }
    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const session = await this.getStripe().billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('stripe.webhookSecret');
    let event: Stripe.Event;
    try {
      event = this.getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret ?? '');
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${(err as Error).message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
    return { received: true };
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    if (!tenantId) return;
    if (session.subscription && typeof session.subscription === 'string') {
      const sub = await this.getStripe().subscriptions.retrieve(session.subscription);
      await this.syncSubscription(tenantId, sub);
    }
  }

  private async onSubscriptionUpdated(sub: Stripe.Subscription) {
    const tenantId = sub.metadata?.tenantId;
    if (!tenantId) return;
    await this.syncSubscription(tenantId, sub);
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription) {
    const tenantId = sub.metadata?.tenantId;
    if (!tenantId) return;
    await this.subsRepo.update(
      { tenantId },
      { status: 'canceled', stripeSubscriptionId: sub.id },
    );
    await this.tenantsService.updatePlan(tenantId, 'free');
  }

  private async syncSubscription(tenantId: string, stripeSub: Stripe.Subscription) {
    const priceId = stripeSub.items.data[0]?.price?.id ?? null;
    const plan = this.planFromPriceId(priceId);

    let sub = await this.subsRepo.findOne({ where: { tenantId } });
    if (!sub) {
      sub = this.subsRepo.create({ tenantId });
    }
    sub.stripeSubscriptionId = stripeSub.id;
    sub.status = stripeSub.status;
    sub.priceId = priceId;
    sub.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
    await this.subsRepo.save(sub);
    await this.tenantsService.updatePlan(tenantId, plan);
  }

  private resolvePriceId(plan: 'starter' | 'pro'): string {
    if (plan === 'pro') return this.config.get<string>('stripe.pricePro') ?? '';
    return this.config.get<string>('stripe.priceStarter') ?? '';
  }

  private planFromPriceId(priceId: string | null): PlanId {
    const pro = this.config.get<string>('stripe.pricePro');
    const starter = this.config.get<string>('stripe.priceStarter');
    if (priceId === pro) return 'pro';
    if (priceId === starter) return 'starter';
    return 'free';
  }
}
