import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { BACKEND_URL } from '../constants/api';

export default function Catalog() {
  const token = useAuthStore((state) => state.token);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sugar');
  const [price, setPrice] = useState('');
  const [sampleType, setSampleType] = useState('Serum (Blood)');
  const [fastingRequirement, setFastingRequirement] = useState('No Fasting');
  const [turnaroundTime, setTurnaroundTime] = useState('24 Hours');
  const [description, setDescription] = useState('');

  const fetchCatalog = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/tests`);
      if (res.data.success) {
        setTests(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openAddModal = () => {
    setEditingTest(null);
    setName('');
    setCategory('Sugar');
    setPrice('');
    setSampleType('Serum (Blood)');
    setFastingRequirement('No Fasting');
    setTurnaroundTime('24 Hours');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (test) => {
    setEditingTest(test);
    setName(test.name);
    setCategory(test.category);
    setPrice(test.price.toString());
    setSampleType(test.sampleType);
    setFastingRequirement(test.fastingRequirement || 'No Fasting');
    setTurnaroundTime(test.turnaroundTime || '24 Hours');
    setDescription(test.description || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !sampleType) return;

    const payload = {
      name,
      category,
      price: parseFloat(price),
      sampleType,
      fastingRequirement,
      turnaroundTime,
      description
    };

    try {
      if (editingTest) {
        // Edit PUT request
        const res = await axios.put(`${BACKEND_URL}/api/tests/${editingTest._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setTests((prev) => prev.map((t) => (t._id === editingTest._id ? res.data.data : t)));
        }
      } else {
        // Add POST request
        const res = await axios.post(`${BACKEND_URL}/api/tests`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setTests((prev) => [...prev, res.data.data]);
        }
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (testId) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;

    try {
      const res = await axios.delete(`${BACKEND_URL}/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTests((prev) => prev.filter((t) => t._id !== testId));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950 min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Test Catalog Manager</h2>
          <p className="text-slate-400 text-sm mt-1">Configure diagnostic items, blood packages and fasting guidelines</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-sky-500/20 transition-all active:scale-[0.98]"
        >
          ➕ Add New Test
        </button>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400">Loading catalog items...</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Test Detail / Category</th>
                <th className="py-4 px-6">Fasting Rules</th>
                <th className="py-4 px-6">Sample Tube</th>
                <th className="py-4 px-6">Turnaround Time</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {tests.map((test) => (
                <tr key={test._id} className="hover:bg-slate-850/40 transition-colors">
                  {/* Name */}
                  <td className="py-4 px-6">
                    <span className="text-white font-semibold block">{test.name}</span>
                    <span className="text-slate-400 text-xs mt-1 block max-w-sm truncate">{test.description || 'No description provided'}</span>
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mt-1 block">{test.category}</span>
                  </td>

                  {/* Fasting */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      test.fastingRequirement?.includes('Fasting')
                        ? 'bg-amber-950/40 text-amber-300'
                        : 'bg-slate-800 text-slate-350'
                    }`}>
                      ⏳ {test.fastingRequirement || 'No Fasting'}
                    </span>
                  </td>

                  {/* Tube */}
                  <td className="py-4 px-6 text-sm text-slate-200">
                    🧬 {test.sampleType}
                  </td>

                  {/* TAT */}
                  <td className="py-4 px-6 text-sm text-slate-300 font-medium">
                    ⏱️ {test.turnaroundTime || '24 Hours'}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-6 text-base font-extrabold text-white">
                    ₹ {test.price}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(test)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(test._id)}
                        className="bg-rose-950/20 hover:bg-rose-600 border border-rose-900 hover:border-rose-500 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add/Edit Form */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingTest ? '✏️ Edit Diagnostic Test' : '➕ Add New Diagnostic Test'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Test Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Category</label>
                  <select
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Sugar">Diabetes</option>
                    <option value="Thyroid">Thyroid</option>
                    <option value="Lipid">Lipid & Heart</option>
                    <option value="Liver">Liver & Kidney</option>
                    <option value="Infection">Infection</option>
                    <option value="Vitamins">Vitamins</option>
                    <option value="Bundles">Packages (Bundles)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Price (INR)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="e.g. 350"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Sample Type</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Serum (Blood)"
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Turnaround Time</label>
                  <input
                    type="text"
                    className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="e.g. 12 Hours"
                    value={turnaroundTime}
                    onChange={(e) => setTurnaroundTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Fasting Requirement</label>
                <select
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                  value={fastingRequirement}
                  onChange={(e) => setFastingRequirement(e.target.value)}
                >
                  <option value="No Fasting">No Fasting Required</option>
                  <option value="10 Hours Fasting">10 Hours Fasting Required</option>
                  <option value="12 Hours Fasting">12 Hours Fasting Required</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Description</label>
                <textarea
                  className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 h-20 resize-none"
                  placeholder="Describe testing details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-sky-500/20 transition-all active:scale-[0.98]"
                >
                  Save Catalog Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
