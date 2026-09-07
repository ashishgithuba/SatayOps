const User = require('./user.model');
const PG = require('./pg.model');
const Floor = require('./floor.model');
const Room = require('./room.model');
const Bed = require('./bed.model');
const Resident = require('./resident.model');
const ResidentDocument = require('./residentDocument.model');
const BedAllocation = require('./bedAllocation.model');

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

module.exports = {
  User,
  PG,
  Floor,
  Room,
  Bed,
  Resident,
  ResidentDocument,
  BedAllocation,
};
