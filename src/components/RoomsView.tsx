import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  BedDouble,
  CheckCircle2,
  Wrench,
  XCircle,
  Filter,
  Layers,
  ChevronDown,
  X,
} from 'lucide-react';
import { usePG } from '../context/PGContext';
import { BedStatus, SharingType, Room } from '../types';
import { formatCurrency } from '../utils/helpers';
import { SensitiveEditModal } from './SensitiveEditModal';

export const RoomsView: React.FC = () => {
  const {
    buildings,
    floors,
    rooms,
    addRoom,
    editRoom,
    deleteRoom,
    updateBedStatus,
    addBuilding,
    addFloor,
    setActiveView,
    setSelectedResidentId,
  } = usePG();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('ALL');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'>('ALL');

  // Modals state
  const [showAddRoomModal, setShowAddRoomModal] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showAddBuildingModal, setShowAddBuildingModal] = useState<boolean>(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState<boolean>(false);

  // Sensitive edit protection (Passcode 6565)
  const [showSensitiveEditModal, setShowSensitiveEditModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // New room form state
  const [newRoomNumber, setNewRoomNumber] = useState<string>('');
  const [newBuildingId, setNewBuildingId] = useState<string>(buildings[0]?.id || '');
  const [newFloorId, setNewFloorId] = useState<string>('');
  const [newSharingType, setNewSharingType] = useState<SharingType>('3-Sharing');
  const [newCapacity, setNewCapacity] = useState<number>(3);
  const [newBaseRent, setNewBaseRent] = useState<number>(8500);

  // New building form
  const [newBuildingName, setNewBuildingName] = useState<string>('');
  const [newBuildingDesc, setNewBuildingDesc] = useState<string>('');

  // New floor form
  const [targetBuildingForFloor, setTargetBuildingForFloor] = useState<string>(buildings[0]?.id || '');
  const [newFloorName, setNewFloorName] = useState<string>('');

  // Bed status modal
  const [selectedBedForStatus, setSelectedBedForStatus] = useState<{
    bedId: string;
    bedNumber: string;
    roomNumber: string;
    currentStatus: BedStatus;
    residentName?: string;
  } | null>(null);

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (selectedBuildingId !== 'ALL' && room.buildingId !== selectedBuildingId) return false;
    if (selectedFloorId !== 'ALL' && room.floorId !== selectedFloorId) return false;
    if (statusFilter === 'AVAILABLE' && !room.beds.some((b) => b.status === 'Available')) return false;
    if (statusFilter === 'OCCUPIED' && !room.beds.some((b) => b.status === 'Occupied')) return false;
    if (statusFilter === 'MAINTENANCE' && !room.beds.some((b) => b.status === 'Maintenance')) return false;
    return true;
  });

  // Calculate totals
  const allBeds = rooms.flatMap((r) => r.beds);
  const totalBeds = allBeds.length;
  const availableBeds = allBeds.filter((b) => b.status === 'Available').length;
  const occupiedBeds = allBeds.filter((b) => b.status === 'Occupied').length;
  const maintenanceBeds = allBeds.filter((b) => b.status === 'Maintenance').length;

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newBuildingId || !newFloorId) return;
    addRoom(newBuildingId, newFloorId, newRoomNumber, newSharingType, newCapacity, newBaseRent);
    setShowAddRoomModal(false);
    setNewRoomNumber('');
  };

  const handleCreateBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName) return;
    addBuilding(newBuildingName, newBuildingDesc);
    setShowAddBuildingModal(false);
    setNewBuildingName('');
    setNewBuildingDesc('');
  };

  const handleCreateFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName || !targetBuildingForFloor) return;
    addFloor(targetBuildingForFloor, newFloorName);
    setShowAddFloorModal(false);
    setNewFloorName('');
  };

  const triggerProtectedAction = (action: () => void) => {
    setPendingAction(() => action);
    setShowSensitiveEditModal(true);
  };

  const handleSharingChange = (type: SharingType) => {
    setNewSharingType(type);
    if (type === 'Single') setNewCapacity(1);
    else if (type === '2-Sharing') setNewCapacity(2);
    else if (type === '3-Sharing') setNewCapacity(3);
    else if (type === '4-Sharing') setNewCapacity(4);
  };

  return (
    <div id="rooms-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Property, Rooms & Beds
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Visual hierarchy & bed occupancy status
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="add-building-btn"
            onClick={() => setShowAddBuildingModal(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Building</span>
          </button>
          <button
            id="add-floor-btn"
            onClick={() => setShowAddFloorModal(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Floor</span>
          </button>
          <button
            id="add-room-btn"
            onClick={() => {
              setNewBuildingId(buildings[0]?.id || '');
              const buildingFloors = floors.filter((f) => f.buildingId === buildings[0]?.id);
              setNewFloorId(buildingFloors[0]?.id || '');
              setShowAddRoomModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Room</span>
          </button>
        </div>
      </div>

      {/* Bed Status Legend and Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-slate-900"></span>
          <div>
            <p className="text-xs text-slate-500">Total Beds</p>
            <p className="text-sm font-bold text-slate-900">{totalBeds}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <p className="text-xs text-slate-500">🟢 Available</p>
            <p className="text-sm font-bold text-emerald-700">{availableBeds} Beds</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <div>
            <p className="text-xs text-slate-500">🔴 Occupied</p>
            <p className="text-sm font-bold text-rose-700">{occupiedBeds} Beds</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <div>
            <p className="text-xs text-slate-500">🟡 Maintenance</p>
            <p className="text-sm font-bold text-amber-700">{maintenanceBeds} Beds</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Building selector */}
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Building
          </label>
          <select
            id="building-filter-select"
            value={selectedBuildingId}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              setSelectedFloorId('ALL');
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Buildings ({buildings.length})</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor selector */}
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Floor
          </label>
          <select
            id="floor-filter-select"
            value={selectedFloorId}
            onChange={(e) => setSelectedFloorId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Floors</option>
            {floors
              .filter((f) => selectedBuildingId === 'ALL' || f.buildingId === selectedBuildingId)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Bed Status
          </label>
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Has Available Beds (🟢)</option>
            <option value="OCCUPIED">Has Occupied Beds (🔴)</option>
            <option value="MAINTENANCE">Has Maintenance Beds (🟡)</option>
          </select>
        </div>
      </div>

      {/* Room Visual Grid */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">No Rooms Match Filter</h3>
          <p className="text-xs text-slate-500 mb-4">Try changing the building or floor filter.</p>
          <button
            onClick={() => {
              setSelectedBuildingId('ALL');
              setSelectedFloorId('ALL');
              setStatusFilter('ALL');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const building = buildings.find((b) => b.id === room.buildingId);
            const floor = floors.find((f) => f.id === room.floorId);
            const occupiedInRoom = room.beds.filter((b) => b.status === 'Occupied').length;
            const availableInRoom = room.beds.filter((b) => b.status === 'Available').length;

            return (
              <div
                key={room.id}
                id={`room-card-${room.roomNumber}`}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between relative group"
              >
                {/* Room Header */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">Room {room.roomNumber}</h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {room.sharingType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {building?.name || 'Building A'} • {floor?.name || 'Floor 1'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(room.baseRent)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/ bed / mo</span>
                    </div>
                  </div>

                  {/* Bed Status Visual Indicators (Green = Available, Red = Occupied, Yellow = Maintenance) */}
                  <div className="my-4 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                      <span>Beds ({occupiedInRoom}/{room.capacity} Occupied)</span>
                      <span className="text-emerald-700 font-medium">
                        {availableInRoom} Available
                      </span>
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {room.beds.map((bed) => {
                        let dotColor = 'bg-emerald-500 text-emerald-700 border-emerald-200 bg-emerald-50';
                        let dotIndicator = '🟢';
                        if (bed.status === 'Occupied') {
                          dotColor = 'bg-rose-50 text-rose-700 border-rose-200';
                          dotIndicator = '🔴';
                        } else if (bed.status === 'Maintenance') {
                          dotColor = 'bg-amber-50 text-amber-700 border-amber-200';
                          dotIndicator = '🟡';
                        }

                        return (
                          <div
                            key={bed.id}
                            id={`bed-${bed.id}`}
                            onClick={() =>
                              setSelectedBedForStatus({
                                bedId: bed.id,
                                bedNumber: bed.bedNumber,
                                roomNumber: room.roomNumber,
                                currentStatus: bed.status,
                                residentName: bed.residentName,
                              })
                            }
                            className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition shadow-2xs ${dotColor}`}
                            title={`Click to change status of ${bed.bedNumber}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{bed.bedNumber}</span>
                              <span className="text-[10px]">{dotIndicator}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[10px] font-semibold uppercase block truncate">
                                {bed.status}
                              </span>
                              {bed.residentName && (
                                <span className="text-[10px] text-slate-600 block truncate font-medium">
                                  {bed.residentName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Click any bed to toggle status</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        triggerProtectedAction(() => {
                          setEditingRoom(room);
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Room (Requires Passcode)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        triggerProtectedAction(() => {
                          if (confirm(`Delete Room ${room.roomNumber}?`)) {
                            const success = deleteRoom(room.id);
                            if (!success) alert('Cannot delete room with occupied beds.');
                          }
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Room (Requires Passcode)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bed Status Toggle Modal */}
      {selectedBedForStatus && (
        <div
          id="bed-status-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedBedForStatus(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Room {selectedBedForStatus.roomNumber} • Bed {selectedBedForStatus.bedNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Status:{' '}
              <span className="font-semibold text-slate-800">{selectedBedForStatus.currentStatus}</span>
              {selectedBedForStatus.residentName && ` (${selectedBedForStatus.residentName})`}
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  updateBedStatus(selectedBedForStatus.bedId, 'Available');
                  setSelectedBedForStatus(null);
                }}
                className="w-full p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Set Available</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  updateBedStatus(selectedBedForStatus.bedId, 'Maintenance');
                  setSelectedBedForStatus(null);
                }}
                className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Set Maintenance</span>
                </div>
                <Wrench className="w-4 h-4 text-amber-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div
          id="add-room-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddRoomModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Room</h3>
            <p className="text-xs text-slate-500 mb-4">Define building, floor, room number and sharing</p>

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Building</label>
                  <select
                    value={newBuildingId}
                    onChange={(e) => {
                      setNewBuildingId(e.target.value);
                      const bFloors = floors.filter((f) => f.buildingId === e.target.value);
                      setNewFloorId(bFloors[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Floor</label>
                  <select
                    value={newFloorId}
                    onChange={(e) => setNewFloorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {floors
                      .filter((f) => f.buildingId === newBuildingId)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Room Number / Name</label>
                <input
                  required
                  placeholder="e.g. 204, G-02, 301"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sharing Type</label>
                  <select
                    value={newSharingType}
                    onChange={(e) => handleSharingChange(e.target.value as SharingType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Single">Single Sharing (1 Bed)</option>
                    <option value="2-Sharing">2-Sharing (2 Beds)</option>
                    <option value="3-Sharing">3-Sharing (3 Beds)</option>
                    <option value="4-Sharing">4-Sharing (4 Beds)</option>
                    <option value="Custom">Custom Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Base Monthly Rent (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={newBaseRent}
                    onChange={(e) => setNewBaseRent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Create Room & Beds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      {showAddBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddBuildingModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-3">Add New Building</h3>
            <form onSubmit={handleCreateBuilding} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Building Name</label>
                <input
                  required
                  placeholder="e.g. Building C, South Wing, Annex"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input
                  placeholder="e.g. 3 Floors, Premium Executive"
                  value={newBuildingDesc}
                  onChange={(e) => setNewBuildingDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBuildingModal(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                >
                  Save Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {showAddFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddFloorModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Floor</h3>
            <form onSubmit={handleCreateFloor} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Building</label>
                <select
                  value={targetBuildingForFloor}
                  onChange={(e) => setTargetBuildingForFloor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Floor Name</label>
                <input
                  required
                  placeholder="e.g. Floor 3, Third Floor, Terrace"
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFloorModal(false)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                >
                  Save Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sensitive Edit Passcode Protection Modal */}
      <SensitiveEditModal
        isOpen={showSensitiveEditModal}
        onClose={() => {
          setShowSensitiveEditModal(false);
          setPendingAction(null);
        }}
        onVerified={() => {
          if (pendingAction) pendingAction();
          setPendingAction(null);
        }}
      />
    </div>
  );
};
