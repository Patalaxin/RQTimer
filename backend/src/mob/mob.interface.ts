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
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
} from './dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from './dto/respawn-lost.dto';
import { RolesTypes } from '../schemas/user.schema';

export interface IMob {
  createMob(createMobDto: CreateMobDtoRequest): Promise<GetFullMobDtoResponse>;

  findMob(getMobDto: GetMobDtoRequest): Promise<GetFullMobWithUnixDtoResponse>;

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
  ): Promise<GetFullMobDtoResponse>;

  updateMobDateOfDeath(
    nickname: string,
    role: RolesTypes,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetFullMobDtoResponse>;

  updateMobDateOfRespawn(
    nickname: string,
    role: RolesTypes,
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetFullMobDtoResponse>;

  deleteMob(
    deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse>;

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
  ): Promise<GetFullMobDtoResponse>;
}
