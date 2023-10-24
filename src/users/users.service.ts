import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateExcludedDto } from './dto/update-excluded.dto';
import { UpdateUnavailableDto } from './dto/update-unavailable.dto';
import { User, UserDocument } from '../schemas/user.schema';
import { Token, TokenDocument } from '../schemas/refreshToken.schema';
import { SessionId, SessionIdDocument } from '../schemas/sessionID.schema';
import { RolesTypes } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SessionId.name)
    private sessionIdModel: Model<SessionIdDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const compareSessionId = await this.sessionIdModel.findOne({
      _id: { $eq: createUserDto.sessionId },
    });
    if (compareSessionId === null) {
      throw new BadRequestException('Wrong SessionId!');
    }
    await this.sessionIdModel.deleteMany({});
    const newUser = await this.userModel.create(createUserDto);
    newUser.password = await bcrypt.hash(newUser.password, 10);
    await this.tokenModel.create({ email: newUser.email });
    return newUser.toObject();
  }

  async findUser(email: string) {
    try {
      const user = await this.userModel.findOne({ email: email }).lean().exec();
      if (!user._id) {
        throw new BadRequestException();
      }
      return user;
    } catch (error) {
      throw new BadRequestException('User does not exist!');
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .select({ email: 1, _id: 1, nickname: 1 })
      .lean()
      .exec();
  }

  async updateRole(email: string, role: RolesTypes) {
    const user = await this.findUser(email);
    await this.userModel
      .updateOne({ email: user.email }, { role: role }, { new: true })
      .lean()
      .exec();
    return 'the Role has been updated successfully';
  }

  async deleteAll() {
    return this.userModel.deleteMany();
  }

  async deleteOne(email: string) {
    return this.userModel.deleteOne({ email: email });
  }

  async updateUnavailable(updateUnavailableDto: UpdateUnavailableDto) {
    const user = await this.findUser(updateUnavailableDto.email);
    await this.userModel
      .updateOne(
        { email: user.email },
        {
          unavailableBosses: updateUnavailableDto.unavailableBosses,
          unavailableElites: updateUnavailableDto.unavailableElites,
        },
        { new: true },
      )
      .lean()
      .exec();
    return 'Unavailable entities have been successfully updated';
  }

  async updateExcluded(updateExcludedDto: UpdateExcludedDto) {
    const user = await this.findUser(updateExcludedDto.email);
    await this.userModel
      .updateOne(
        { email: user.email },
        {
          excludedBosses: updateExcludedDto.excludedBosses,
          excludedElites: updateExcludedDto.excludedElites,
        },
        { new: true },
      )
      .lean()
      .exec();
    return 'Excluded entities have been successfully updated';
  }

  async generateSessionId() {
    await this.sessionIdModel.deleteMany({});
    let sessionId = await this.sessionIdModel.create({ _id: randomUUID() });
    return sessionId.toObject();
  }
}
