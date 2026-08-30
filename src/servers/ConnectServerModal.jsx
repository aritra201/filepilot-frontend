import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../api/client';
import { useConnectServer } from '../hooks/useServers';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

export function ConnectServerModal({ open, onClose }) {
  const navigate = useNavigate();
  const connect = useConnectServer();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');

  const reset = () => {
    setHost('');
    setPort('22');
    setUsername('');
    setPassword('');
    setLabel('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await connect.mutateAsync({
        host,
        port: Number(port) || 22,
        username,
        password,
        label: label || undefined,
      });
      toast.success('Connected successfully');
      reset();
      onClose();
      navigate(`/explorer?server=${data.savedServerId}&path=${encodeURIComponent(data.rootPath || '/mnt')}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not connect'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Connect new server"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="connect-form" loading={connect.isPending}>
            Connect
          </Button>
        </>
      }
    >
      <form id="connect-form" className="space-y-4" onSubmit={onSubmit}>
        <Input
          id="label"
          label="Label"
          placeholder="Home Lab"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          id="host"
          label="Host / IP"
          placeholder="192.168.1.150"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          required
        />
        <Input
          id="port"
          label="Port"
          type="number"
          min={1}
          max={65535}
          value={port}
          onChange={(e) => setPort(e.target.value)}
        />
        <Input
          id="username"
          label="Username"
          placeholder="debian"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-xs text-text-muted">
          The SSH password is used only for this session and is never stored.
        </p>
      </form>
    </Modal>
  );
}
