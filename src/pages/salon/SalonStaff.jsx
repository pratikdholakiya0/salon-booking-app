import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, Phone } from 'lucide-react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import ImageUpload from '../../components/ImageUpload';
import './SalonStaff.css';

const empty = { name: '', phone: '', role: '', profileUrl: '' };

export default function SalonStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    try { const r = await api.get('/salon/staff'); setStaff(r.data.staffData); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, phone: s.phone, role: s.role, profileUrl: s.profileUrl || '' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editing ? await api.patch(`/salon/staff/${editing.id}`, form) : await api.post('/salon/staff', form);
      toast(editing ? 'Staff updated' : 'Staff added'); setModal(false); load();
    } catch (err) { toast(err.response?.data?.msg || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try { await api.delete(`/salon/staff/${id}`); toast('Staff removed'); load(); }
    catch (err) { toast(err.response?.data?.msg || 'Delete failed', 'error'); }
  };

  if (loading) return <div className="loader"><span className="spinner" /></div>;

  return (
    <div className="staff-page">
      <div className="page-hd-row">
        <div className="page-hd"><h1>Staff</h1><p>Manage your salon team</p></div>
        <button className="btn btn-gold" onClick={openAdd}><Plus size={15} /> Add Staff</button>
      </div>

      {!staff.length
        ? <div className="empty"><Users size={36} /><h3>No staff added yet</h3><p>Add team members to assign them to bookings.</p></div>
        : <div className="staff-grid">
            {staff.map((s) => (
              <div key={s.id} className="staff-card card">
                <div className="sc-left">
                  <div className="sc-avatar">
                    {s.profileUrl ? <img src={s.profileUrl} alt={s.name} /> : <span>{s.name?.charAt(0)}</span>}
                  </div>
                  <div className="sc-info">
                    <p className="sc-name">{s.name}</p>
                    <p className="sc-role">{s.role}</p>
                    <p className="sc-phone"><Phone size={11} /> {s.phone}</p>
                  </div>
                </div>
                <div className="sc-actions">
                  <button className="btn btn-outline btn-xs" onClick={() => openEdit(s)}><Pencil size={12} /> Edit</button>
                  <button className="btn btn-danger btn-xs" onClick={() => remove(s.id)}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <Modal title={editing ? 'Edit Staff Member' : 'Add Staff Member'} onClose={() => setModal(false)}>
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Jane Doe"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role / Title</label>
              <input className="form-input" placeholder="e.g. Senior Stylist"
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+1 234 567 890"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <ImageUpload
                label="Staff Photo"
                value={form.profileUrl}
                onChange={(url) => setForm({ ...form, profileUrl: url })}
                shape="circle"
                size={80}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
