import { RFPLane } from '@/constants/types';
import { MapPin, MoveRight, Truck, Box, Layers } from 'lucide-react';

export default function LaneTable({ lanes }: { lanes: RFPLane[] }) {
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

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px]">Origin</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px]">Destination</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px]">Equipment</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px]">Volume / Freq</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {lanes.map((lane) => (
            <tr key={lane.id} className="hover:bg-muted/30 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <MapPin size={16} />
                  </div>
                  <span className="font-bold text-foreground">
                    {lane.origin_city}, <span className="text-muted-foreground font-medium">{lane.origin_state}</span>
                  </span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                  <MoveRight size={18} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin size={16} />
                    </div>
                    <span className="font-bold text-foreground">
                      {lane.destination_city}, <span className="text-muted-foreground font-medium">{lane.destination_state}</span>
                    </span>
                  </div>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
