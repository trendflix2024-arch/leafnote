"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ArrowUpDown, Loader2, Clock, Package, Truck, PackageCheck,
    Upload, Download, ImageIcon, MapPin, Hash, MessageSquare, X, Check, AlertCircle,
} from 'lucide-react';
import { CsvImportModal } from './CsvImportModal';
import { BatchActionBar } from './BatchActionBar';
import { SHIPPING_CARRIERS } from '@/lib/magic-frame-config';

interface ShippingUser {
    id: string;
    name: string;
    phone: string;
    submitted: boolean;
    image_url: string | null;
    image_type: string | null;
    updated_at: string | null;
    created_at: string;
    shipping_status: 'pending' | 'new_order' | 'preparing' | 'shipped';
    address: string | null;
    postal_code: string | null;
    address_detail: string | null;
    tracking_number: string | null;
    shipping_carrier: string | null;
    shipping_memo: string | null;
    shipped_at: string | null;
}

type ShippingStatus = ShippingUser['shipping_status'];

const STATUS_CONFIG: Record<ShippingStatus, { label: string; color: string; dot: string; icon: typeof Clock }> = {
    pending: { label: '접수대기', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: Clock },
    new_order: { label: '신규접수', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', icon: Package },
    preparing: { label: '발송준비', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', icon: PackageCheck },
    shipped: { label: '발송완료', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', icon: Truck },
};

const STATUS_OPTIONS: { value: ShippingStatus | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '접수대기' },
    { value: 'new_order', label: '신규접수' },
    { value: 'preparing', label: '발송준비' },
    { value: 'shipped', label: '발송완료' },
];

export function ShippingTab() {
    const [users, setUsers] = useState<ShippingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ShippingStatus | 'all'>('all');
    const [sort, setSort] = useState<'recent' | 'name'>('recent');

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modals
    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<ShippingUser | null>(null);

    // Edit form
    const [editForm, setEditForm] = useState({
        shipping_status: '' as string,
        address: '',
        postal_code: '',
        address_detail: '',
        tracking_number: '',
        shipping_carrier: '',
        shipping_memo: '',
    });
    const [editLoading, setEditLoading] = useState(false);

    // Inline status change
    const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statusFilter !== 'all') params.set('status', statusFilter);
            params.set('sort', sort);
            const res = await fetch(`/api/magic-frame/admin/shipping?${params}`);
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setUsers(data.users || []);
        } catch {
            setError('데이터를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, sort]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // ── Handlers ──

    const handleStatusChange = async (userId: string, newStatus: string) => {
        setStatusDropdown(null);
        try {
            const res = await fetch('/api/magic-frame/admin/shipping', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, shipping_status: newStatus }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setUsers(prev => prev.map(u =>
                u.id === userId ? {
                    ...u,
                    shipping_status: newStatus as ShippingStatus,
                    shipped_at: newStatus === 'shipped' ? new Date().toISOString() : u.shipped_at,
                } : u
            ));
        } catch {
            setError('상태 변경 중 오류가 발생했습니다.');
        }
    };

    const handleBatchStatusChange = async (status: string) => {
        try {
            const res = await fetch('/api/magic-frame/admin/shipping/batch', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: Array.from(selectedIds), shipping_status: status }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setSelectedIds(new Set());
            fetchUsers();
        } catch {
            setError('일괄 변경 중 오류가 발생했습니다.');
        }
    };

    const handleExport = async () => {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const res = await fetch(`/api/magic-frame/admin/shipping/export?${params}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shipping_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const openEditModal = (user: ShippingUser) => {
        setEditUser(user);
        setEditForm({
            shipping_status: user.shipping_status,
            address: user.address || '',
            postal_code: user.postal_code || '',
            address_detail: user.address_detail || '',
            tracking_number: user.tracking_number || '',
            shipping_carrier: user.shipping_carrier || '',
            shipping_memo: user.shipping_memo || '',
        });
    };

    const handleEditSave = async () => {
        if (!editUser) return;
        setEditLoading(true);
        setError('');
        try {
            const res = await fetch('/api/magic-frame/admin/shipping', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: editUser.id, ...editForm }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setUsers(prev => prev.map(u =>
                u.id === editUser.id ? { ...u, ...editForm, shipping_status: editForm.shipping_status as ShippingStatus } : u
            ));
            setEditUser(null);
        } catch {
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setEditLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === users.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(users.map(u => u.id)));
        }
    };

    // ── Helpers ──

    const formatPhone = (phone: string) => {
        if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
        if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
        return phone;
    };

    const formatDate = (d: string | null) => {
        if (!d) return '-';
        return new Date(d).toLocaleString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    // ── Computed ──
    const counts = {
        pending: users.filter(u => u.shipping_status === 'pending').length,
        new_order: users.filter(u => u.shipping_status === 'new_order').length,
        preparing: users.filter(u => u.shipping_status === 'preparing').length,
        shipped: users.filter(u => u.shipping_status === 'shipped').length,
    };

    // When filter is active on the API side, counts reflect filtered data.
    // For the stats bar, we want total counts, so we'll show them only when no filter.
    const allUsers = statusFilter === 'all' ? users : [];

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
                {(Object.entries(STATUS_CONFIG) as [ShippingStatus, typeof STATUS_CONFIG.pending][]).map(([key, cfg]) => (
                    <button key={key}
                        onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                        className={`bg-white rounded-xl p-3 border shadow-sm text-center transition-all ${statusFilter === key ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
                        <p className="text-xl font-bold text-slate-800">
                            {statusFilter === 'all' ? counts[key] : (statusFilter === key ? users.length : '-')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{cfg.label}</p>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="이름 또는 연락처 검색"
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                    </div>
                    <button onClick={() => setSort(prev => prev === 'recent' ? 'name' : 'recent')}
                        className="flex items-center gap-1 px-3 py-2.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                        <ArrowUpDown size={12} /> {sort === 'recent' ? '최근순' : '이름순'}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {STATUS_OPTIONS.map(f => (
                            <button key={f.value} onClick={() => setStatusFilter(f.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${statusFilter === f.value
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1.5">
                        <button onClick={() => setCsvModalOpen(true)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                            <Upload size={12} /> 주소 업로드
                        </button>
                        <button onClick={handleExport}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <Download size={12} /> 내보내기
                        </button>
                    </div>
                </div>
            </div>

            {/* Batch action bar */}
            {selectedIds.size > 0 && (
                <BatchActionBar
                    selectedCount={selectedIds.size}
                    onStatusChange={handleBatchStatusChange}
                    onClearSelection={() => setSelectedIds(new Set())}
                />
            )}

            {/* User list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={28} />
                </div>
            ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Truck size={48} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium">배송 대상이 없습니다</p>
                </div>
            ) : (
                <>
                    {/* Select all */}
                    <div className="flex items-center gap-2 px-1">
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                            <input type="checkbox" checked={selectedIds.size === users.length && users.length > 0}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            전체 선택 ({users.length})
                        </label>
                    </div>

                    <div className="space-y-2">
                        {users.map(user => {
                            const cfg = STATUS_CONFIG[user.shipping_status];
                            const StatusIcon = cfg.icon;
                            return (
                                <motion.div key={user.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${selectedIds.has(user.id) ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-100'}`}>
                                    <div className="flex items-start gap-3 p-4">
                                        {/* Checkbox */}
                                        <input type="checkbox" checked={selectedIds.has(user.id)}
                                            onChange={() => toggleSelect(user.id)}
                                            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0" />

                                        {/* Thumbnail */}
                                        <div className="w-12 h-15 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                            {user.image_url ? (
                                                <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon size={14} className="text-slate-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-sm font-bold text-slate-800">{user.name}</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${cfg.color}`}>
                                                    <StatusIcon size={10} /> {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400">{formatPhone(user.phone)}</p>

                                            {user.address && (
                                                <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
                                                    <MapPin size={11} className="flex-shrink-0 mt-0.5 text-slate-300" />
                                                    <span className="truncate">
                                                        {user.postal_code && `[${user.postal_code}] `}
                                                        {user.address}
                                                        {user.address_detail && ` ${user.address_detail}`}
                                                    </span>
                                                </p>
                                            )}

                                            {user.tracking_number && (
                                                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <Hash size={11} className="flex-shrink-0 text-slate-300" />
                                                    {user.shipping_carrier && <span className="font-medium">{user.shipping_carrier}</span>}
                                                    <span>{user.tracking_number}</span>
                                                </p>
                                            )}

                                            {user.shipping_memo && (
                                                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <MessageSquare size={10} className="flex-shrink-0 text-slate-300" />
                                                    {user.shipping_memo}
                                                </p>
                                            )}

                                            {user.shipped_at && (
                                                <p className="text-[10px] text-slate-300 mt-0.5">
                                                    발송: {formatDate(user.shipped_at)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {/* Status dropdown */}
                                            <div className="relative">
                                                <button onClick={() => setStatusDropdown(statusDropdown === user.id ? null : user.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <StatusIcon size={12} />
                                                    <span className="hidden sm:inline">상태</span>
                                                </button>
                                                {statusDropdown === user.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(null)} />
                                                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20 min-w-[110px]">
                                                            {(Object.entries(STATUS_CONFIG) as [ShippingStatus, typeof STATUS_CONFIG.pending][]).map(([key, c]) => (
                                                                <button key={key}
                                                                    onClick={() => handleStatusChange(user.id, key)}
                                                                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${user.shipping_status === key
                                                                        ? 'text-indigo-600 bg-indigo-50'
                                                                        : 'text-slate-700 hover:bg-slate-50'}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                                                    {c.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Edit button */}
                                            <button onClick={() => openEditModal(user)}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                                                <span className="hidden sm:inline">상세</span>
                                                <MapPin size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* CSV Import Modal */}
            <CsvImportModal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} onImportComplete={fetchUsers} />

            {/* Edit Detail Modal */}
            <AnimatePresence>
                {editUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">

                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">{editUser.name}</h3>
                                    <p className="text-xs text-slate-400">{formatPhone(editUser.phone)}</p>
                                </div>
                                <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="p-5 space-y-4">
                                {error && (
                                    <div className="bg-red-50 text-red-500 text-xs rounded-lg p-2 flex items-center gap-1">
                                        <AlertCircle size={12} /> {error}
                                    </div>
                                )}

                                {/* Status */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">배송 상태</label>
                                    <div className="flex gap-1.5">
                                        {(Object.entries(STATUS_CONFIG) as [ShippingStatus, typeof STATUS_CONFIG.pending][]).map(([key, c]) => (
                                            <button key={key}
                                                onClick={() => setEditForm(prev => ({ ...prev, shipping_status: key }))}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border text-center ${editForm.shipping_status === key
                                                    ? `${c.color} border-current`
                                                    : 'bg-white text-slate-400 border-slate-200'}`}>
                                                {c.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">우편번호</label>
                                    <input value={editForm.postal_code}
                                        onChange={e => setEditForm(prev => ({ ...prev, postal_code: e.target.value }))}
                                        placeholder="12345"
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">주소</label>
                                    <input value={editForm.address}
                                        onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="서울시 강남구 테헤란로 123"
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">상세주소</label>
                                    <input value={editForm.address_detail}
                                        onChange={e => setEditForm(prev => ({ ...prev, address_detail: e.target.value }))}
                                        placeholder="456호"
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>

                                {/* Shipping carrier */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">택배사</label>
                                    <select value={editForm.shipping_carrier}
                                        onChange={e => setEditForm(prev => ({ ...prev, shipping_carrier: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                        <option value="">선택</option>
                                        {SHIPPING_CARRIERS.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tracking number */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">운송장 번호</label>
                                    <input value={editForm.tracking_number}
                                        onChange={e => setEditForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                                        placeholder="1234567890"
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>

                                {/* Memo */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">배송 메모</label>
                                    <textarea value={editForm.shipping_memo}
                                        onChange={e => setEditForm(prev => ({ ...prev, shipping_memo: e.target.value }))}
                                        placeholder="특이사항 메모"
                                        rows={2}
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none" />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-slate-100 flex gap-2">
                                <button onClick={() => setEditUser(null)}
                                    className="flex-1 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                                    취소
                                </button>
                                <button onClick={handleEditSave} disabled={editLoading}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                                    {editLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    저장
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
