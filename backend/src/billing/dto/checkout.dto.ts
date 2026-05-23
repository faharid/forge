import { IsIn, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @IsIn(['starter', 'pro'])
  plan?: 'starter' | 'pro';

  @IsOptional()
  @IsString()
  priceId?: string;
}
