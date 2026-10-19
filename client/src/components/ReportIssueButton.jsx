import { useState } from 'react';
import { createIssueReport } from '../services/api';
import toast from 'react-hot-toast';

export default function ReportIssueButton({ foodRequestId }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await createIssueReport({ foodRequestId, details });
      toast.success('Issue sent to the operator');
      setDetails('');
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit issue');
    } finally {
      setSending(false);
    }
  };

  return <div className="report-issue-control">
    <button className="track-btn" type="button" onClick={() => setOpen(value => !value)}>
      {open ? 'Cancel report' : '⚠️ Report an issue'}
    </button>
    {open && <form className="report-issue-form" onSubmit={submit}>
      <label htmlFor={`issue-${foodRequestId}`}>Tell the operator what happened</label>
      <textarea id={`issue-${foodRequestId}`} minLength={5} maxLength={2000} required value={details} onChange={event => setDetails(event.target.value)} placeholder="Describe the issue (5–2000 characters)" />
      <button className="track-btn" disabled={sending}>{sending ? 'Sending…' : 'Send report'}</button>
    </form>}
  </div>;
}
