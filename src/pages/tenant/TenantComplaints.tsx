import React, { useState, useEffect } from 'react';
import { AlertCircle, Send, Search } from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Card from '../../components/shared/Card';
import StatusIndicator from '../../components/shared/StatusIndicator';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Complaint } from '../../types';
import { format, parseISO } from 'date-fns';

const TenantComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'maintenance',
    priority: 'medium',
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await api.get<{ complaints: Complaint[] }>('/api/complaints');
        setComplaints(
          data.complaints.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch {
        setComplaints([]);
      }
    };
    load();
  }, [user]);

  const validateForm = () => {
    const errors = {
      title: '',
      description: '',
    };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const { data } = await api.post<{ complaint: Complaint }>('/api/complaints', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      });
      setComplaints(prev => [data.complaint, ...prev]);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'maintenance',
        priority: 'medium',
      });
    } catch {
      /* toast optional */
    }
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Complaints</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and submit your complaints</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<AlertCircle className="h-5 w-5" />}
            onClick={() => setShowForm(true)}
          >
            New Complaint
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={formErrors.title}
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="neighbor">Neighbor</option>
                    <option value="facility">Facility</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" leftIcon={<Send className="h-4 w-4" />}>
                  Submit
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="mb-6">
          <Input
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            fullWidth
          />
        </div>

        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{complaint.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{complaint.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {format(parseISO(complaint.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <StatusIndicator status={complaint.status} size="sm" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TenantComplaints;
