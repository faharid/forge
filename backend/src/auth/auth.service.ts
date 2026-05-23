import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { UserRole } from '../common/constants';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Tenant) private tenantsRepo: Repository<Tenant>,
    @InjectRepository(Subscription) private subsRepo: Repository<Subscription>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const slug = this.generateSlug(dto.tenantName ?? dto.email.split('@')[0]);
    const tenant = this.tenantsRepo.create({
      name: dto.tenantName ?? `${dto.email.split('@')[0]}'s Workspace`,
      slug,
      plan: 'free',
    });
    await this.tenantsRepo.save(tenant);

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      tenantId: tenant.id,
      role: UserRole.ADMIN,
    });
    await this.usersRepo.save(user);

    const sub = this.subsRepo.create({ tenantId: tenant.id, status: 'inactive' });
    await this.subsRepo.save(sub);

    const tokens = await this.issueTokens(user);
    return {
      user: this.sanitizeUser(user),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('auth.refreshSecret'),
      });
      const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
      if (!user?.refreshTokenHash) {
        throw new UnauthorizedException();
      }
      const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!valid) {
        throw new UnauthorizedException();
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersRepo.update(userId, { refreshTokenHash: null });
    return { success: true };
  }

  private async issueTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenantId,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('auth.jwtSecret'),
      expiresIn: (this.config.get<string>('auth.jwtExpiry') ?? '24h') as `${number}h`,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.getOrThrow<string>('auth.refreshSecret'),
        expiresIn: (this.config.get<string>('auth.refreshExpiry') ?? '7d') as `${number}d`,
      },
    );
    user.refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);
    await this.usersRepo.save(user);
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
  }

  private generateSlug(base: string): string {
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug}-${crypto.randomBytes(4).toString('hex')}`;
  }
}
