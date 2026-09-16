const User = require('./user.model');
const PG = require('./pg.model');
const Floor = require('./floor.model');
const Room = require('./room.model');
const Bed = require('./bed.model');
const Resident = require('./resident.model');
const ResidentDocument = require('./residentDocument.model');
const BedAllocation = require('./bedAllocation.model');
const RentInvoice = require('./rentInvoice.model');
const Payment = require('./payment.model');
const MaintenanceRequest = require('./maintenanceRequest.model');
const MaintenanceRequestImage = require('./maintenanceRequestImage.model');
const MaintenanceRequestHistory = require('./maintenanceRequestHistory.model');
const Notice = require('./notice.model');
const NoticeRecipient = require('./noticeRecipient.model');
const NoticeAttachment = require('./noticeAttachment.model');

// User  PG Associations
User.hasMany(PG, { foreignKey: 'owner_id', as: 'pgs' });
PG.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// PG Floor Associations
PG.hasMany(Floor, { foreignKey: 'pg_id', as: 'floors' });
Floor.belongsTo(PG, { foreignKey: 'pg_id', as: 'pg' });

// PG Room Associations
PG.hasMany(Room, { foreignKey: 'pg_id', as: 'rooms' });
Room.belongsTo(PG, { foreignKey: 'pg_id', as: 'pg' });

// Floor  Room Associations
Floor.hasMany(Room, { foreignKey: 'floor_id', as: 'rooms' });
Room.belongsTo(Floor, { foreignKey: 'floor_id', as: 'floor' });

// PG  Bed Associations
PG.hasMany(Bed, { foreignKey: 'pg_id', as: 'beds' });
Bed.belongsTo(PG, { foreignKey: 'pg_id', as: 'pg' });

// Floor Bed Associations
Floor.hasMany(Bed, { foreignKey: 'floor_id', as: 'beds' });
Bed.belongsTo(Floor, { foreignKey: 'floor_id', as: 'floor' });

// Room <-> Bed Associations
Room.hasMany(Bed, { foreignKey: 'room_id', as: 'beds' });
Bed.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// User <-> Resident Associations
User.hasMany(Resident, { foreignKey: 'owner_id', as: 'residents' });
Resident.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// User <-> Resident (Login Account link)
User.hasOne(Resident, { foreignKey: 'user_id', as: 'residentProfile' });
Resident.belongsTo(User, { foreignKey: 'user_id', as: 'loginUser' });

// Resident  ResidentDocument Associations
Resident.hasMany(ResidentDocument, { foreignKey: 'resident_id', as: 'documents' });
ResidentDocument.belongsTo(Resident, { foreignKey: 'resident_id', as: 'resident' });

// User (Verifier)  ResidentDocument
User.hasMany(ResidentDocument, { foreignKey: 'verified_by', as: 'verifiedDocuments' });
ResidentDocument.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });

// BedAllocation Associations
Resident.hasMany(BedAllocation, { foreignKey: 'resident_id', as: 'allocations' });
BedAllocation.belongsTo(Resident, { foreignKey: 'resident_id', as: 'resident' });

PG.hasMany(BedAllocation, { foreignKey: 'pg_id', as: 'allocations' });
BedAllocation.belongsTo(PG, { foreignKey: 'pg_id', as: 'pg' });

Room.hasMany(BedAllocation, { foreignKey: 'room_id', as: 'allocations' });
BedAllocation.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

Bed.hasMany(BedAllocation, { foreignKey: 'bed_id', as: 'allocations' });
BedAllocation.belongsTo(Bed, { foreignKey: 'bed_id', as: 'bed' });

// BedAllocation <-> RentInvoice Associations
BedAllocation.hasMany(RentInvoice, { foreignKey: 'allocation_id', as: 'invoices' });
RentInvoice.belongsTo(BedAllocation, { foreignKey: 'allocation_id', as: 'allocation' });

// Resident <-> RentInvoice Associations
Resident.hasMany(RentInvoice, { foreignKey: 'resident_id', as: 'invoices' });
RentInvoice.belongsTo(Resident, { foreignKey: 'resident_id', as: 'resident' });

// RentInvoice <-> Payment Associations
RentInvoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });
Payment.belongsTo(RentInvoice, { foreignKey: 'invoice_id', as: 'invoice' });

// Resident <-> Payment Associations
Resident.hasMany(Payment, { foreignKey: 'resident_id', as: 'payments' });
Payment.belongsTo(Resident, { foreignKey: 'resident_id', as: 'resident' });

// MaintenanceRequest Associations
PG.hasMany(MaintenanceRequest, { foreignKey: 'pg_id', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(PG, { foreignKey: 'pg_id', as: 'pg' });

Resident.hasMany(MaintenanceRequest, { foreignKey: 'resident_id', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(Resident, { foreignKey: 'resident_id', as: 'resident' });

Bed.hasMany(MaintenanceRequest, { foreignKey: 'bed_id', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(Bed, { foreignKey: 'bed_id', as: 'bed' });

// MaintenanceRequest Images
MaintenanceRequest.hasMany(MaintenanceRequestImage, { foreignKey: 'maintenance_request_id', as: 'images' });
MaintenanceRequestImage.belongsTo(MaintenanceRequest, { foreignKey: 'maintenance_request_id', as: 'maintenanceRequest' });

// MaintenanceRequest History
MaintenanceRequest.hasMany(MaintenanceRequestHistory, { foreignKey: 'maintenance_request_id', as: 'history' });
MaintenanceRequestHistory.belongsTo(MaintenanceRequest, { foreignKey: 'maintenance_request_id', as: 'maintenanceRequest' });

User.hasMany(MaintenanceRequestHistory, { foreignKey: 'changed_by', as: 'statusChanges' });
MaintenanceRequestHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

// Notice Associations
PG.hasMany(Notice, { foreignKey: 'pg_id', as: 'notices' });
Notice.belongsTo(PG, { foreignKey: 'pg_id', as: 'pg' });

User.hasMany(Notice, { foreignKey: 'created_by', as: 'createdNotices' });
Notice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

Notice.hasMany(NoticeRecipient, { foreignKey: 'notice_id', as: 'recipients' });
NoticeRecipient.belongsTo(Notice, { foreignKey: 'notice_id', as: 'notice' });

Resident.hasMany(NoticeRecipient, { foreignKey: 'resident_id', as: 'noticesReceived' });
NoticeRecipient.belongsTo(Resident, { foreignKey: 'resident_id', as: 'resident' });

Notice.hasMany(NoticeAttachment, { foreignKey: 'notice_id', as: 'attachments' });
NoticeAttachment.belongsTo(Notice, { foreignKey: 'notice_id', as: 'notice' });

module.exports = {
  User,
  PG,
  Floor,
  Room,
  Bed,
  Resident,
  ResidentDocument,
  BedAllocation,
  RentInvoice,
  Payment,
  MaintenanceRequest,
  MaintenanceRequestImage,
  MaintenanceRequestHistory,
  Notice,
  NoticeRecipient,
  NoticeAttachment,
};
