import { useState } from 'react';
import { RFPInvite, Carrier } from '@/constants/types';
import { INVITE_STATUSES } from '@/constants/statuses';
import {
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Clock,
  Trash2,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import CarrierDetailsModal from '@/components/CarrierDetailsModal';

const ITEMS_PER_PAGE = 10;

export default function InviteTable({ invites }: { invites: RFPInvite[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

  if (invites.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-muted/20">
        <div className="inline-flex h-16 w-16 rounded-3xl bg-muted/50 items-center justify-center mb-4 text-muted-foreground/50">
          <UserPlus size={32} />
        </div>
        <p className="text-foreground font-bold">No carriers invited</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto font-medium">Use the search above to find and invite approved partners to this tender event.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(invites.length / ITEMS_PER_PAGE);
  const paginatedInvites = invites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px]">Carrier Partner</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px]">Invite Status</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px]">Sent On</th>
            <th className="px-6 py-5 font-black text-muted-foreground tracking-[0.1em] uppercase text-[10px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {paginatedInvites.map((invite) => {
            const statusInfo = INVITE_STATUSES.find((s) => s.value === invite.status);

            const StatusIcon = invite.status === 'submitted' ? ShieldCheck :
              invite.status === 'opened' ? ExternalLink : Clock;

            const statusColor = invite.status === 'submitted' ? 'bg-primary/10 text-primary border-primary/20' :
              invite.status === 'opened' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' :
                'bg-accent/10 text-accent border-accent/20';

            return (
              <tr key={invite.id} className="hover:bg-muted/30 transition-colors group">
                <td
                  className="px-6 py-5 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => {
                    if (invite.carrier) {
                      setSelectedCarrier(invite.carrier as Carrier);
                    }
                  }}
                >
                  <div className="font-bold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
                    {invite.carrier?.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
                    <Mail size={12} className="opacity-50" />
                    {invite.carrier?.email}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor}`}>
                    <StatusIcon size={12} />
                    {statusInfo?.label || invite.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-muted-foreground font-bold text-xs">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="opacity-40" />
                    {new Date(invite.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (invite.carrier) {
                          setSelectedCarrier(invite.carrier as Carrier);
                        }
                      }}
                      className="text-[10px] uppercase tracking-widest"
                    >
                      <Eye size={12} className="mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/bid/${invite.access_token}`;
                        navigator.clipboard.writeText(url);
                        alert('Copied secure bidding link to clipboard!');
                      }}
                      className="text-[10px] uppercase tracking-widest"
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="danger-outline"
                      size="sm"
                      className="text-[10px] uppercase tracking-widest"
                    >
                      <Trash2 size={12} className="mr-1.5" />
                      Revoke
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={invites.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {selectedCarrier && (
        <CarrierDetailsModal
          onClose={() => setSelectedCarrier(null)}
          carrier={selectedCarrier}
        />
      )}
    </div>
  );
}
