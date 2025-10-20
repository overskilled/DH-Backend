import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DepartementsService {
  constructor(private prisma: PrismaService) { }

  create(createDepartementDto: CreateDepartementDto) {
    return 'This action adds a new departement';
  }

  async findAll() {
    const departement = await this.prisma.department.findMany()

    return departement;
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id }
    });

    if (!department) {
      throw new NotFoundException('departement not found');
    }


    return department;
  }

  update(id: number, updateDepartementDto: UpdateDepartementDto) {
    return `This action updates a #${id} departement`;
  }

  remove(id: number) {
    return `This action removes a #${id} departement`;
  }
}
