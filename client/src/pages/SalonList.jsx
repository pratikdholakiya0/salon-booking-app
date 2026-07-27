import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Clock, Search, Inbox, X } from 'lucide-react';
import api from '../api';
import './SalonList.css';

const WORK_LABELS = {
  HAIR: '✂️ Hair', BEARD: '💈 Beard', NAILS: '💅 Nails',
  FACIAL: '✨ Facial', MASSAGE: '💆 Massage', MAKEUP: '💄 Makeup',
  SKINCARE: '🧴 Skincare', THREADING: '🪡 Threading', WAX: '🕯️ Wax',
};

export default function SalonList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  // Read ?work= from URL (set by category click on home page)
  const workFilter = searchParams.get('work') || '';

  const fetchSalons = async (s = search, c = city, w = workFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (s) params.search = s;
      if (c) params.city = c;
      if (w) params.work = w;
      const res = await api.get('/salons', { params });
      setSalons(res.data.salons);
    } catch { setSalons([]); }
    finally { setLoading(false); }
  };

  // Re-fetch whenever the work URL param changes
  useEffect(() => { fetchSalons(); }, [workFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSalons(search, city, workFilter);
  };

  const clearWorkFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="salon-list-page">
      <div className="salon-list-hero">
        <div className="container">
          <h1>
            {workFilter
              ? <>{WORK_LABELS[workFilter] || workFilter} <span className="gold">Salons</span></>
              : <>Explore <span className="gold">Salons</span></>
            }
          </h1>
          <p>
            {workFilter
              ? `Showing salons that offer ${WORK_LABELS[workFilter] || workFilter} services`
              : 'Find the perfect salon near you'
            }
          </p>

          {/* Active service filter badge */}
          {workFilter && (
            <div className="active-filter-bar">
              <span className="active-filter-badge">
                {WORK_LABELS[workFilter] || workFilter}
                <button onClick={clearWorkFilter} title="Clear filter"><X size={12} /></button>
              </span>
            </div>
          )}

          <form className="search-bar" onSubmit={handleSearch}>
            <div className="search-field">
              <Search size={15} className="search-icon" />
              <input className="search-input" placeholder="Search salon name..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="search-field">
              <MapPin size={15} className="search-icon" />
              <input className="search-input" placeholder="City..."
                value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-gold">Search</button>
          </form>
        </div>
      </div>

      <div className="container salon-list-body">
        {loading ? (
          <div className="loader"><span className="spinner" /> Loading salons...</div>
        ) : salons.length === 0 ? (
          <div className="empty">
            <Inbox size={40} />
            <h3>No salons found</h3>
            <p>
              {workFilter
                ? `No salons offer ${WORK_LABELS[workFilter] || workFilter} services yet.`
                : 'Try a different city or search term.'
              }
            </p>
            {workFilter && (
              <button className="btn btn-outline btn-sm" style={{ marginTop: 14 }} onClick={clearWorkFilter}>
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="salons-grid">
            {salons.map((s) => (
              <Link to={`/salons/${s.userId}`} key={s.userId} className="salon-card card">
                <div className="salon-card-img">
                  {s.profileUrl
                    ? <img src={s.profileUrl} alt={s.salonName} />
                    : <div className="salon-card-placeholder"><span>{s.salonName?.charAt(0)}</span></div>}
                  <div className="salon-badge">Open</div>
                </div>
                <div className="salon-card-body">
                  <h3 className="salon-card-name">{s.salonName}</h3>
                  <p className="salon-card-bio">{s.bio || 'Premium salon experience'}</p>
                  <div className="salon-card-meta">
                    <span className="meta-item"><MapPin size={12} /> {s.city}</span>
                    <span className="meta-item"><Clock size={12} /> {s.openingTime} – {s.closingTime}</span>
                  </div>
                </div>
                <div className="salon-card-footer">
                  <span className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    View &amp; Book
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
