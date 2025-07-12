import { CreateMobDtoRequest } from './dto/create-mob.dto';
import {
  GetFullMobDtoResponse,
  GetFullMobWithUnixDtoResponse,
  GetMobDtoRequest, GetMobDtoResponse,
} from './dto/get-mob.dto';
import { GetMobsDtoRequest } from './dto/get-all-mobs.dto';
import {
  UpdateMobDtoBodyRequest,
  UpdateMobDtoParamsRequest,
} from './dto/update-mob.dto';
import { UpdateMobByCooldownDtoRequest } from './dto/update-mob-by-cooldown.dto';
import { UpdateMobDateOfDeathDtoRequest } from './dto/update-mob-date-of-death.dto';
import { UpdateMobDateOfRespawnDtoRequest } from './dto/update-mob-date-of-respawn.dto';
import {
  DeleteAllMobsDataDtoResponse,
  DeleteMobDtoResponse,
  RemoveMobFromGroupDtoParamsRequest,
  RemoveMobFromGroupDtoResponse,
} from './dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import { RolesTypes } from '../schemas/user.schema';
import { Mob } from '../schemas/mob.schema';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { Servers } from '../schemas/mobs.enum';
import {
  UpdateMobCommentDtoBodyRequest,
  UpdateMobCommentDtoParamsRequest,
} from './dto/update-mob-comment.dto';

export interface IMob {
  createMob(createMobDto: CreateMobDtoRequest): Promise<Mob>;

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

  findAllMobsByUser(
    email: string,
    getMobsDto: GetMobsDtoRequest,
    lang: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]>;

  findAllMobsByGroup(
    groupName: string,
    getMobsDto: GetMobsDtoRequest,
    lang: string,
  ): Promise<GetFullMobWithUnixDtoResponse[]>;

  findAllAvailableMobs(lang: string): Promise<Mob[]>;

  updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<Mob>;

  updateMobByCooldown(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: string,
    updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  updateMobDateOfDeath(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: string,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  updateMobDateOfRespawn(
    nickname: string,
    role: RolesTypes,
    mobId: string,
    server: string,
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  deleteMob(mobId: string): Promise<DeleteMobDtoResponse>;

  removeMobFromGroup(
    removeMobDtoParams: RemoveMobFromGroupDtoParamsRequest,
    groupName: string,
  ): Promise<RemoveMobFromGroupDtoResponse>;

  crashMobServer(
    groupName: string,
    email: string,
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
