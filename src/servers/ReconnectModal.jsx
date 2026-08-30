import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../api/client';
import { useReconnectServer, useServers } from '../hooks/useServers';
import { useUiStore } from '../store/uiStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

export function ReconnectModal() {
  const reconnect = useUiStore((s) => s.reconnect);
  const closeReconnect = useUiStore((s) => s.closeReconnect);
  const { data: servers = [] } = useServers();
  const mutation = useReconnectServer();
  const server = servers.find((s) => s.id === reconnect.serverId);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (server) setUsername(server.last_username || '');
  }, [server]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({ id: reconnect.serverId, username, password });
      toast.success('Reconnected');
      closeReconnect();
      setPassword('');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Reconnect failed'));
    }
  };

  return (
    <Modal
      open={reconnect.open}
      onClose={closeReconnect}
      title="Session ended — reconnect?"
      footer={
        <>
          <Button variant="secondary" onClick={closeReconnect}>
            Cancel
          </Button>
          <Button type="submit" form="reconnect-form" loading={mutation.isPending}>
            Reconnect
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-on-surface-variant">
        The SSH session for{' '}
        <span className="font-mono text-on-surface">{server?.host || 'this server'}</span> is no
        longer active. Enter username and password to reconnect.
      </p>
      <form id="reconnect-form" className="space-y-4" onSubmit={onSubmit}>
        <Input
          id="reconnect-username"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          id="reconnect-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}
