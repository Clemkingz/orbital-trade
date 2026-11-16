import { Injectable } from "@nestjs/common";

/** FR-8.7: read-only audit log, export (super admin). No delete endpoint. */
@Injectable()
export class AuditService {}
