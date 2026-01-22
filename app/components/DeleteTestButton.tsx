'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/app/context/ToastContext';

export default function DeleteTestButton({ testId }: { testId: number }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation if inside one

    if (!confirm('Are you sure you want to delete this test?\n\nThis will permanently delete ALL questions and student submissions associated with it.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        addToast('Test deleted successfully', 'success');
        router.refresh();
      } else {
        addToast('Failed to delete test', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting test', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete Test"
      style={{
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '2.5rem',
        height: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDeleting ? 'wait' : 'pointer',
        alignSelf: 'center',
        boxShadow: '2px 2px 0px #b91c1c',
        transition: 'transform 0.1s'
      }}
    >
      {isDeleting ? '...' : '🗑️'}
    </button>
  );
}
