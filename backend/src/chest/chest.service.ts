import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChestData, ChestDataDocument } from '../schemas/chest.schema';
import { Servers } from '../schemas/mobs.enum';
import { ChestsLocations, ChestsTypes } from '../schemas/chest.enum';
import { ChestTypeRequestDto } from './dto/add-chests-in-group.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChestResponseDto } from './dto/get-chests.dto';

export class ChestService {
  constructor(
    @InjectModel(ChestData.name)
    private readonly chestModel: Model<ChestDataDocument>,
  ) {}

  async addChests(
    server: Servers,
    location: ChestsLocations,
    groupName: string,
    chestTypeRequestDto: ChestTypeRequestDto[],
  ): Promise<ChestData[]> {
    const createdChests = [];

    for (const chestRequest of chestTypeRequestDto) {
      const { type, count } = chestRequest;

      // Найти текущий максимальный typeChestId для данного типа сундука в локации
      const maxChest = await this.chestModel
        .find({ location, groupName, chestTypes: type, server })
        .sort({ typeChestId: -1 })
        .limit(1);

      let nextTypeChestId =
        maxChest.length > 0 ? maxChest[0].typeChestId + 1 : 0;

      // Добавляем сундуки
      for (let i = 0; i < count; i++) {
        const newChest = new this.chestModel({
          chestTypes: type,
          groupName,
          server,
          location,
          respawnTime: null,
          openingTime: null,
          typeChestId: nextTypeChestId,
        });

        await newChest.save();
        createdChests.push(newChest);
        nextTypeChestId++;
      }
    }

    return createdChests;
  }

  async getChests(
    server: Servers,
    groupName: string,
    page: number = 1,
    limit: number = 25,
    locations?: string,
    types?: string,
  ): Promise<ChestResponseDto> {
    const filter: any = { server, groupName };

    if (locations) {
      const locationArray = locations.split(',').map((loc) => loc.trim());

      filter.location = { $in: locationArray };
    }

    if (types && types.length > 0) {
      const typesArray = types.split(',').map((loc) => loc.trim());

      filter.chestTypes = { $in: typesArray };
    }

    const total = await this.chestModel.countDocuments(filter);

    // Получаем данные с учетом пагинации
    const data = await this.chestModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total };
  }

  async openChest(
    server: Servers,
    location: ChestsLocations,
    chestTypes: ChestsTypes,
    groupName: string,
    openingTime: number,
  ): Promise<ChestData> {
    const chests = await this.chestModel
      .find({ server, location, chestTypes, groupName })
      .exec();

    const chestToOpen = chests.find(
      (chest) => !chest.respawnTime || chest.respawnTime < openingTime,
    );

    if (!chestToOpen) {
      throw new BadRequestException(
        'There are no chests available to open in this location',
      );
    }

    chestToOpen.openingTime = openingTime;

    switch (chestTypes) {
      case ChestsTypes.Железный_сундук:
        chestToOpen.respawnTime = openingTime + 900000;
        break;
      case ChestsTypes.Золотой_сундук:
        chestToOpen.respawnTime = openingTime + 3600000;
        break;
      case ChestsTypes.Кристальный_сундук:
        chestToOpen.respawnTime = openingTime + 7200000;
        break;
    }
    await chestToOpen.save();
    return chestToOpen;
  }

  async resetChest(
    server: Servers,
    location: ChestsLocations,
    chestTypes: ChestsTypes,
    groupName: string,
    typeChestId: number,
  ): Promise<ChestData> {
    const chestToReset = await this.chestModel.findOne({
      server,
      location,
      chestTypes,
      groupName,
      typeChestId,
    });

    if (!chestToReset) {
      throw new NotFoundException('Chest not found');
    }
    chestToReset.respawnTime = null;
    chestToReset.openingTime = null;

    await chestToReset.save();

    return chestToReset;
  }

  async deleteChest(
    server: Servers,
    location: ChestsLocations,
    chestTypes: ChestsTypes,
    groupName: string,
    typeChestId: number,
  ): Promise<void> {
    const chestToDelete = await this.chestModel.findOne({
      server,
      location,
      chestTypes,
      groupName,
      typeChestId,
    });

    if (!chestToDelete) {
      throw new NotFoundException('Chest not found');
    }

    await this.chestModel.deleteOne({
      _id: chestToDelete._id,
    });
  }
}
