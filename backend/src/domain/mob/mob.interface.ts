import { CreateMobDtoRequest } from '../../mob/dto/create-mob.dto';
import {
  GetFullMobDtoResponse,
  GetMobDataDtoResponse,
  GetMobDtoRequest,
  GetMobDtoResponse,
} from '../../mob/dto/get-mob.dto';
import { GetMobsDtoRequest } from '../../mob/dto/get-all-mobs.dto';
import {
  UpdateMobDtoBodyRequest,
  UpdateMobDtoParamsRequest,
} from '../../mob/dto/update-mob.dto';
import { UpdateMobByCooldownDtoRequest } from '../../mob/dto/update-mob-by-cooldown.dto';
import { UpdateMobDateOfDeathDtoRequest } from '../../mob/dto/update-mob-date-of-death.dto';
import { UpdateMobDateOfRespawnDtoRequest } from '../../mob/dto/update-mob-date-of-respawn.dto';
import {
  DeleteMobDtoParamsRequest,
  DeleteMobDtoResponse,
} from '../../mob/dto/delete-mob.dto';
import { RespawnLostDtoParamsRequest } from '../../mob/dto/respawn-lost.dto';

export interface IMob {
  createMob(createMobDto: CreateMobDtoRequest): Promise<GetFullMobDtoResponse>;

  findMob(getMobDto: GetMobDtoRequest): Promise<GetFullMobDtoResponse>;

  findAllMobsByUser(
    email: string,
    getMobsDto: GetMobsDtoRequest,
  ): Promise<GetFullMobDtoResponse[]>;

  updateMob(
    updateMobDtoBody: UpdateMobDtoBodyRequest,
    updateMobDtoParams: UpdateMobDtoParamsRequest,
  ): Promise<GetMobDtoResponse>;

  updateMobByCooldown(
    nickname: string,
    updateMobByCooldownDto: UpdateMobByCooldownDtoRequest,
  ): Promise<GetMobDataDtoResponse>;

  updateMobDateOfDeath(
    nickname: string,
    updateMobDateOfDeathDto: UpdateMobDateOfDeathDtoRequest,
  ): Promise<GetMobDataDtoResponse>;

  updateMobDateOfRespawn(
    nickname: string,
    updateMobDateOfRespawnDto: UpdateMobDateOfRespawnDtoRequest,
  ): Promise<GetMobDataDtoResponse>;

  deleteMob(
    deleteMobDtoParams: DeleteMobDtoParamsRequest,
  ): Promise<DeleteMobDtoResponse>;

  crashMobServer(
    email: string,
    nickname: string,
    server: string,
  ): Promise<GetFullMobDtoResponse[]>;

  respawnLost(
    respawnLostDtoParams: RespawnLostDtoParamsRequest,
  ): Promise<GetMobDataDtoResponse>;
}
