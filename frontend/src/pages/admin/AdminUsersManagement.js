import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../../components/common/BackButton';
import api from '../../utils/api';
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserPlus,
  Shield,
  Building,
  User,
  Award,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

const AdminUsersManagement = ({ onBack }) => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    filterUsuarios();
  }, [usuarios, searchTerm, roleFilter]);

  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/users');
      setUsuarios(response.data.usuarios || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsuarios = () => {
    let filtered = [...usuarios];

    // Filtro por rol
    if (roleFilter !== 'todos') {
      filtered = filtered.filter(usuario => usuario.role === roleFilter);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsuarios(filtered);
  };

  const handleEditUser = (usuario) => {
    setEditingUser({ ...usuario });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    try {
      await api.put(`/api/admin/users/${editingUser.id}`, {
        nombre: editingUser.nombre,
        telefono: editingUser.telefono,
        role: editingUser.role,
        activo: editingUser.activo,
        puntos: editingUser.puntos
      });

      await loadUsuarios();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alert('Error actualizando usuario: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);
      await loadUsuarios();
    } catch (error) {
      console.error('Error desactivando usuario:', error);
      alert('Error desactivando usuario: ' + (error.response?.data?.error || error.message));
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'authority':
        return <Building className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'authority':
        return 'Autoridad';
      default:
        return 'Ciudadano';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'authority':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <BackButton onBack={onBack} />
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-xl h-12"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <BackButton onBack={onBack} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Gestión de Usuarios</span>
          </h1>
          <p className="text-gray-600">
            {filteredUsuarios.length} de {usuarios.length} usuarios
          </p>
        </div>
        <button
          onClick={loadUsuarios}
          className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setRoleFilter('todos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              roleFilter === 'todos'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>Todos ({usuarios.length})</span>
          </button>
          <button
            onClick={() => setRoleFilter('citizen')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              roleFilter === 'citizen'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ciudadanos ({usuarios.filter(u => u.role === 'citizen').length})</span>
          </button>
          <button
            onClick={() => setRoleFilter('authority')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              roleFilter === 'authority'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Autoridades ({usuarios.filter(u => u.role === 'authority').length})</span>
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              roleFilter === 'admin'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admins ({usuarios.filter(u => u.role === 'admin').length})</span>
          </button>
        </div>
      </div>

      {/* Lista de usuarios */}
      {filteredUsuarios.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
          <p className="text-gray-600">
            {usuarios.length === 0 
              ? 'No hay usuarios registrados en el sistema'
              : 'No hay usuarios que coincidan con los filtros aplicados'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsuarios.map((usuario) => (
            <div key={usuario.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{usuario.nombre}</h3>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(usuario.role)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(usuario.role)}`}>
                        {getRoleLabel(usuario.role)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">{usuario.puntos} puntos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Reportes:</span>
                      <span className="text-sm font-medium">{usuario.total_reportes}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Desde:</span>
                      <span className="text-sm font-medium">{formatDate(usuario.created_at)}</span>
                    </div>
                  </div>

                  {usuario.telefono && (
                    <p className="text-sm text-gray-600 mt-2">📞 {usuario.telefono}</p>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <div className="flex items-center space-x-1">
                    {usuario.activo ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-xs ${usuario.activo ? 'text-green-600' : 'text-red-600'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditUser(usuario)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar usuario"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(usuario.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Desactivar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Usuario</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingUser.nombre}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editingUser.telefono || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="citizen">Ciudadano</option>
                  <option value="authority">Autoridad</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puntos</label>
                <input
                  type="number"
                  value={editingUser.puntos}
                  onChange={(e) => setEditingUser({ ...editingUser, puntos: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={editingUser.activo}
                  onChange={(e) => setEditingUser({ ...editingUser, activo: e.target.checked })}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Usuario activo
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersManagement;