import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Scissors, Clock, DollarSign } from 'lucide-react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import './SalonServices.css';

const WORK_CATS = ['HAIR','BEARD','MAKEUP','FACIAL','MASSAGE','NAILS','SKINCARE','THREADING','WAX'];
const empty = { name: '', work: 'HAIR', description: '', duration: 30, price: '' };

export default function SalonServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    try { const r = await api.get('/salon/service'); setServices(r.data.serviceData); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, work: s.work, description: s.description || '', duration: s.duration, price: s.price }); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editing ? await api.patch(`/salon/service/${editing.id}`, form) : await api.post('/salon/service', form);
      toast(editing ? 'Service updated' : 'Service added'); setModal(false); load();
    } catch (err) { toast(err.response?.data?.msg || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this service?')) return;
    try { await api.delete(`/salon/service/${id}`); toast('Service deleted'); load(); }
    catch (err) { toast(err.response?.data?.msg || 'Delete failed', 'error'); }
  };

  if (loading) return <div className="loader"><span className="spinner" /></div>;

  return (
    <div className="svc-page">
      <div className="page-hd-row">
        <div className="page-hd"><h1>Services</h1><p>Manage your salon offerings</p></div>
        <button className="btn btn-gold" onClick={openAdd}><Plus size={15} /> Add Service</button>
      </div>

      {!services.length
        ? <div className="empty"><Scissors size={36} /><h3>No services yet</h3><p>Add your first service to get started.</p></div>
        : <div className="svc-grid grid-3">
            {services.map((s) => (
              <div key={s.id} className="svc-manage-card card">
                <div className="smc-header">
                  <span className="smc-work-badge">{s.work}</span>
                  <div className="smc-acts">
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(s)} title="Edit"><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-icon" onClick={() => remove(s.id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="smc-name">{s.name}</h3>
                {s.description && <p className="smc-desc">{s.description}</p>}
                <div className="smc-footer">
                  <span className="smc-meta-item"><Clock size={13} /> {s.duration} min</span>
                  <span className="smc-price">${s.price}</span>
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <Modal title={editing ? 'Edit Service' : 'Add New Service'} onClose={() => setModal(false)}>
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input className="form-input" placeholder="e.g. Classic Haircut"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.work} onChange={(e) => setForm({ ...form, work: e.target.value })}>
                {WORK_CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} placeholder="Brief description..."
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Duration (min)</label>
                <input type="number" min={5} className="form-input"
                  value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input type="number" min={0} step="0.01" className="form-input"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Service' : 'Add Service'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
