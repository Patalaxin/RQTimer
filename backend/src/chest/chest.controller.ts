import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TokensGuard } from '../guards/tokens.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AddChestBodyRequestDto } from './dto/add-chests-in-group.dto';
import { ChestService } from './chest.service';
import { GetGroupNameFromToken } from '../decorators/getGroupName.decorator';
import { Servers } from '../schemas/mobs.enum';
import { ChestsLocations, ChestsTypes } from '../schemas/chest.enum';
import { ChestData } from '../schemas/chest.schema';
import { Roles } from '../decorators/roles.decorator';
import { ChestResponseDto } from './dto/get-chests.dto';

@ApiTags('Chest API')
@ApiBearerAuth()
@UseGuards(TokensGuard, RolesGuard)
@Controller('chests')
export class ChestController {
  constructor(private readonly chestService: ChestService) {}

  @Roles()
  @ApiOperation({ summary: 'Add chests in location' })
  @Post(':server/:location')
  async addChests(
    @Param('server') server: Servers,
    @Param('location') location: ChestsLocations,
    @GetGroupNameFromToken() groupName: string,
    @Body() body: AddChestBodyRequestDto,
  ): Promise<ChestData[]> {
    return this.chestService.addChests(
      server,
      location,
      groupName,
      body.chests,
    );
  }

  @Roles()
  @ApiOperation({ summary: 'Get chests' })
  @ApiQuery({ name: 'locations', required: false })
  @ApiQuery({ name: 'types', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get(':server')
  async getChests(
    @Param('server') server: Servers,
    @GetGroupNameFromToken() groupName: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 25,
    @Query('locations') locations?: string,
    @Query('types') types?: string,
  ): Promise<ChestResponseDto> {
    return this.chestService.getChests(
      server,
      groupName,
      page,
      limit,
      locations,
      types,
    );
  }

  @Roles()
  @ApiOperation({ summary: 'Open chest' })
  @Post('open/:server/:location/:chestTypes')
  async openChest(
    @Param('server') server: Servers,
    @Param('location') location: ChestsLocations,
    @Param('chestTypes') chestTypes: ChestsTypes,
    @GetGroupNameFromToken() groupName: string,
    @Body('openingTime') openingTime: number,
  ): Promise<ChestData> {
    return this.chestService.openChest(
      server,
      location,
      chestTypes,
      groupName,
      openingTime,
    );
  }

  @Roles()
  @ApiOperation({ summary: 'Reset chest' })
  @Put('reset/:server/:location/:chestTypes/:typeChestId')
  async resetChest(
    @Param('server') server: Servers,
    @Param('location') location: ChestsLocations,
    @Param('chestTypes') chestTypes: ChestsTypes,
    @GetGroupNameFromToken() groupName: string,
    @Param('typeChestId') typeChestId: number,
  ): Promise<ChestData> {
    return this.chestService.resetChest(
      server,
      location,
      chestTypes,
      groupName,
      typeChestId,
    );
  }

  @Roles()
  @ApiOperation({ summary: 'Delete chest' })
  @Delete('/:server/:location/:chestTypes/:typeChestId')
  async deleteChest(
    @Param('server') server: Servers,
    @Param('location') location: ChestsLocations,
    @Param('chestTypes') chestTypes: ChestsTypes,
    @GetGroupNameFromToken() groupName: string,
    @Param('typeChestId') typeChestId: number,
  ): Promise<void> {
    return this.chestService.deleteChest(
      server,
      location,
      chestTypes,
      groupName,
      typeChestId,
    );
  }
}
