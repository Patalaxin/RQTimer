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
import { UpdateMobByCooldownDtoRequest } from './dto/update-mob-by-cooldown.dto';
import { UpdateMobDateOfDeathDtoRequest } from './dto/update-mob-date-of-death.dto';
import { UpdateMobDateOfRespawnDtoRequest } from './dto/update-mob-date-of-respawn.dto';
import {
  DeleteAllMobsDataDtoResponse,
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
  DeleteMobFromGroupDtoParamsRequest,
  DeleteMobFromGroupDtoResponse,
} from './dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import { RolesTypes } from '../schemas/user.schema';
import { Mob } from '../schemas/mob.schema';
import { AddMobInGroupDtoRequest } from './dto/add-mob-in-group.dto';
import { MobsData } from '../schemas/mobsData.schema';

export interface IMob {
  createMob(createMobDto: CreateMobDtoRequest): Promise<Mob>;

  addMobInGroup(
    addMobInGroupDto: AddMobInGroupDtoRequest,
    groupName: string,
  ): Promise<MobsData>;

  findMob(
    getMobDto: GetMobDtoRequest,
    groupName: string,
  ): Promise<GetFullMobWithUnixDtoResponse>;

  findAllMobsByUser(
    email: string,
    getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobWithUnixDtoResponse[]>;

  updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse>;

  updateMobByCooldown(
    nickname: string,
    role: RolesTypes,
    updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  updateMobDateOfDeath(
    nickname: string,
    role: RolesTypes,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  updateMobDateOfRespawn(
    nickname: string,
    role: RolesTypes,
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
    groupName: string,
  ): Promise<GetFullMobDtoResponse>;

  deleteMob(
    deleteMobDtoParams: DeleteMobDtoParamsRequest,
    groupName: string,
  ): Promise<DeleteMobDtoResponse>;

  deleteMobFromGroup(
    deleteMobDtoParams: DeleteMobFromGroupDtoParamsRequest,
    groupName: string,
  ): Promise<DeleteMobFromGroupDtoResponse>;

  crashMobServer(
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
}
