/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Patch, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './interface/users.interface';
import { UpdateUserDto } from './dto/users.dto';
import type { RequestWithUser } from 'src/auth/interface/auth.interface';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  async getUsers() {
    try {
      const findAllUsersData: User[] = await this.userService.findAllUser();
      return { data: findAllUsersData, message: 'findAll' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('/:id')
  async getUserById(@Param() id: string) {
    try {
      const findOneUserData: User = await this.userService.findUserById(id);

      return { data: findOneUserData, message: 'findOne' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Patch('/id')
  async updateUser(@Body() userData: UpdateUserDto, @Param() id: string, @Req() req: RequestWithUser) {
    try {
      const authorId = id;
      const userId = String(req.user.id);
      const authorRole = String(req.user.role);

      if (userId !== authorId && authorRole === Role.user) {
        throw new HttpException('Opération impossible', HttpStatus.NOT_FOUND);
      }

      if (!req.file && !userData.avatar) {
        return { message: 'Aucun fichier envoyé' };
      }

      if (req.file && req.file?.filename) {
        const url = `${req.protocol}://${req.get('host')}/public/avatar/${req.file.filename}`;
        userData.avatar = url;
        console.log('✅ Nouvel avatar reçu :', url);
      }

      console.log('🧠 Données envoyées au service :', userData);
      const updateUserData = await this.userService.updateUser(authorId, userData);

      return { data: updateUserData, message: 'updated' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete('/:id')
  async deleteUser(@Param() id: string, @Req() req: RequestWithUser) {
    try {
      const auth = { id: req.user.id, role: req.user.role as string };
      const deleteUserData: User = await this.userService.deleteUser(id, auth);

      return { data: deleteUserData, message: 'deleted' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
