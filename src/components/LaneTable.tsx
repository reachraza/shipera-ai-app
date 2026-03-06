import { useState } from 'react';
import { RFPLane } from '@/constants/types';
import { MapPin, MoveRight, Truck, Box, Layers, Trash2 } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';

const ITEMS_PER_PAGE = 10;

interface LaneTableProps {
  lanes: RFPLane[];
  onDelete?: (laneId: string) => void;
  onBulkDelete?: (laneIds: string[]) => void;
  isLocked?: boolean;
  hasInvites?: boolean;
}

export default function LaneTable({ lanes, onDelete, onBulkDelete, isLocked, hasInvites }: LaneTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(new Set(lanes.map(l => l.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selected));
      setSelected(new Set());
    }
  };

  if (lanes.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-muted/20">
        <div className="inline-flex h-16 w-16 rounded-3xl bg-muted/50 items-center justify-center mb-4 text-muted-foreground/50">
          <Layers size={32} />
        </div>
        <p className="text-foreground font-bold">No lanes added</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Upload a CSV file or add lanes manually to populate this tender&apos;s requirements.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(lanes.length / ITEMS_PER_PAGE);
  const paginatedLanes = lanes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="overflow-x-auto w-full relative">
      {selected.size > 0 && onBulkDelete && !isLocked && !hasInvites && (
        <div className="absolute top-0 left-0 w-full h-14 bg-card/95 backdrop-blur-md border-b border-border z-20 flex items-center justify-between px-6 animate-in slide-in-from-top-2 fade-in">
          <span className="text-sm font-bold text-foreground">
            {selected.size} {selected.size === 1 ? 'lane' : 'lanes'} selected
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            className="h-8 gap-2 font-black shadow-lg shadow-red-500/20"
          >
            <Trash2 size={14} />
            Delete Selected
          </Button>
        </div>
      )}

      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {onBulkDelete && !isLocked && !hasInvites && (
              <th className="px-6 py-5 w-14">
                <input
                  type="checkbox"
                  className="rounded border-border/50 bg-card text-primary focus:ring-primary focus:ring-offset-background w-4 h-4 cursor-pointer"
                  checked={lanes.length > 0 && selected.size === lanes.length}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            <th className={`${(!onBulkDelete || isLocked || hasInvites) ? 'px-6' : 'px-2'} py-5 font-black text-muted-foreground tracking-widest uppercase text-[10px]`}>Origin</th>
            <th className="w-10 px-2 py-5"></th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-widest uppercase text-[10px]">Destination</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-widest uppercase text-[10px]">Equipment</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-widest uppercase text-[10px]">Volume / Freq</th>
            {onDelete && !isLocked && !hasInvites && <th className="px-6 py-5 font-black text-muted-foreground tracking-widest uppercase text-[10px] text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {paginatedLanes.map((lane) => (
            <tr key={lane.id} className="hover:bg-muted/30 transition-colors group">
              {onBulkDelete && !isLocked && !hasInvites && (
                <td className="px-6 py-5">
                  <input
                    type="checkbox"
                    className="rounded border-border/50 bg-card text-primary focus:ring-primary focus:ring-offset-background w-4 h-4 cursor-pointer"
                    checked={selected.has(lane.id)}
                    onChange={() => handleSelect(lane.id)}
                  />
                </td>
              )}
              <td className={`${(!onBulkDelete || isLocked || hasInvites) ? 'px-6' : 'px-2'} py-5`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <MapPin size={16} />
                  </div>
                  <span className="font-bold text-foreground">
                    {lane.origin_city}, <span className="text-muted-foreground font-medium">{lane.origin_state}</span>
                  </span>
                </div>
              </td>
              <td className="w-10 px-2 py-5 text-center">
                <MoveRight size={18} className="text-muted-foreground/30 group-hover:text-primary transition-colors mx-auto" />
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin size={16} />
                  </div>
                  <span className="font-bold text-foreground">
                    {lane.destination_city}, <span className="text-muted-foreground font-medium">{lane.destination_state}</span>
                  </span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:border-primary/20 transition-all">
                  <Truck size={12} className="text-primary" />
                  {lane.equipment_type}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <Box size={14} className="text-muted-foreground" />
                  {lane.frequency || <span className="italic font-medium opacity-40">TBD</span>}
                </div>
              </td>
              {onDelete && !isLocked && !hasInvites && (
                <td className="px-6 py-5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(lane.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-lg"
                    title={`Delete lane from ${lane.origin_city} to ${lane.destination_city}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              )}
            </tr>
          ))}
          {paginatedLanes.length > 0 && paginatedLanes.length < ITEMS_PER_PAGE && (
            Array.from({ length: ITEMS_PER_PAGE - paginatedLanes.length }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-[73px] bg-transparent">
                <td colSpan={(onDelete && !isLocked && !hasInvites ? 6 : 5) + (onBulkDelete && !isLocked && !hasInvites ? 1 : 0)}></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={lanes.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div >
  );
}
