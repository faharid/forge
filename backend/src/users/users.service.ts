import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { withTenantFilter } from '../common/tenant-context';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = 12;

  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findAll(tenantId: string) {
    const users = await this.usersRepo.find({
      where: withTenantFilter(tenantId),
      select: ['id', 'email', 'role', 'createdAt', 'tenantId'],
    });
    return users;
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.usersRepo.findOne({
      where: withTenantFilter(tenantId, { id }),
      select: ['id', 'email', 'role', 'createdAt', 'tenantId'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      tenantId,
      role: dto.role,
    });
    await this.usersRepo.save(user);
    return this.findOne(tenantId, user.id);
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto, requesterId: string) {
    const user = await this.usersRepo.findOne({ where: withTenantFilter(tenantId, { id }) });
    if (!user) throw new NotFoundException('User not found');
    if (dto.email) user.email = dto.email;
    if (dto.role) user.role = dto.role;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    await this.usersRepo.save(user);
    return this.findOne(tenantId, user.id);
  }

  async remove(tenantId: string, id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete yourself');
    }
    const result = await this.usersRepo.delete(withTenantFilter(tenantId, { id }));
    if (!result.affected) throw new NotFoundException('User not found');
    return { success: true };
  }
}
