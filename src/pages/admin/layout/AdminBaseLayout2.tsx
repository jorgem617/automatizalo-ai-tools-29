
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';

interface AdminBaseLayoutProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  hideTitle?: boolean;
  className?: string;
}

const AdminBaseLayout = ({ 
  title = "Admin Dashboard", 
  description, 
  children,
  hideTitle = true, // Set default to true to avoid duplication
  className = ""
}: AdminBaseLayoutProps) => {
  return (
    <AdminLayout title={title} hideTitle={hideTitle}>
      <div className={className}>
        {description && <p className="text-gray-600 mb-4 text-sm">{description}</p>}
        {children || <Outlet />}
      </div>
    </AdminLayout>
  );
};

export default AdminBaseLayout;
