import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { CurrentUserPayload } from "../decorators/current-user.decorator";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: CurrentUserPayload;
    }>();
    if (request.user?.role !== "admin") {
      throw new ForbiddenException("Admin access required");
    }
    return true;
  }
}
