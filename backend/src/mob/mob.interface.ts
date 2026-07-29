import { CreateMobDtoRequest } from './dto/create-mob.dto';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
} from './dto/get-mob.dto';
import { GetMobsDtoRequest } from './dto/get-all-mobs.dto';
import {
  UpdateMobDtoBodyRequest,
  UpdateMobDtoParamsRequest,
} from './dto/update-mob.dto';
import { UpdateMobRespawnDtoRequest } from './dto/update-mob-respawn.dto';
import {
  DeleteAllMobsDataDtoResponse,
  DeleteMobDtoResponse,
  RemoveMobFromGroupDtoParamsRequest,
  RemoveMobFromGroupDtoResponse,
} from './dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import { RolesTypes } from '../schemas/roles.enum';
import { MobDto } from './dto/mob.dto';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { Servers } from '../schemas/mobs.enum';
import {
  UpdateMobCommentDtoBodyRequest,
  UpdateMobCommentDtoParamsRequest,
} from './dto/update-mob-comment.dto';

export interface IMob {
  createMob(createMobDto: CreateMobDtoRequest): Promise<MobDto>;

  addMobInGroup(
    email: string,
    server: Servers,
    addMobInGroupDto: AddMobInGroupDtoRequest,
    groupName: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]>;

  getMob(getMobDto: GetMobDtoRequest, lang: string): Promise<GetMobDtoResponse>;

  getMobFromGroup(
    getMobDto: GetMobDtoRequest,
    groupName: string,
    lang: string,
  ): Promise<GetFullMobWithUnixDtoResponse>;

  findAllGroupMobs(
    getMobsDto: GetMobsDtoRequest,
    groupName: string,
    lang: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]>;

  findAllMobsByGroup(
    groupName: string,
    getMobsDto: GetMobsDtoRequest,
    lang: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]>;

  findAllAvailableMobs(lang: string): Promise<MobDto[]>;

  updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<MobDto>;

  updateMobRespawn(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: string,
    updateMobRespawnDto: UpdateMobRespawnDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  deleteMob(mobId: string): Promise<DeleteMobDtoResponse>;

  removeMobFromGroup(
    removeMobDtoParams: RemoveMobFromGroupDtoParamsRequest,
    groupName: string,
  ): Promise<RemoveMobFromGroupDtoResponse>;

  crashMobServer(
    groupName: string,
    nickname: string,
    role: string,
    server: string,
  ): Promise<GetFullMobDtoResponse[]>;

  respawnLost(
    respawnLostDtoParams: RespawnLostDtoParamsRequest,
    nickname: string,
    role: RolesTypes,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  deleteAllMobData(groupName: string): Promise<DeleteAllMobsDataDtoResponse>;

  updateMobComment(
    groupName: string,
    updateMobCommentBody: UpdateMobCommentDtoBodyRequest,
    updateMobCommentParams: UpdateMobCommentDtoParamsRequest,
  ): Promise<GetFullMobDtoResponse>;
}
