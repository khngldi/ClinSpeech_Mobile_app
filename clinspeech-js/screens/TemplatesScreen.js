import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Switch,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { apiFetch, safeJson } from '../api';

const MINT = '#2ec4b6';

export default function TemplatesScreen() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', template_data: '', is_public: false });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/templates/');
            const data = await safeJson(res);
            setTemplates(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.log('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditId(null);
        setForm({ name: '', template_data: '', is_public: false });
        setShowModal(true);
    };

    const openEdit = (template) => {
        setEditId(template.id);
        setForm({
            name: template.name,
            template_data: template.template_data || '',
            is_public: template.is_public || false,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.name || !form.template_data) {
            Alert.alert('Ошибка', 'Заполните все обязательные поля');
            return;
        }

        setSaving(true);
        try {
            if (editId) {
                await apiFetch(`/templates/${editId}/`, {
                    method: 'PATCH',
                    body: JSON.stringify(form),
                });
            } else {
                await apiFetch('/templates/', {
                    method: 'POST',
                    body: JSON.stringify(form),
                });
            }
            setShowModal(false);
            loadTemplates();
        } catch (error) {
            console.log('Error saving template:', error);
            Alert.alert('Ошибка', 'Не удалось сохранить шаблон');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Удалить шаблон',
            'Вы уверены, что хотите удалить этот шаблон?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiFetch(`/templates/${id}/`, { method: 'DELETE' });
                            loadTemplates();
                        } catch (error) {
                            console.log('Error deleting template:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить шаблон');
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={s.templateCard}>
            <View style={s.cardHeader}>
                <Text style={s.templateName} numberOfLines={1}>{item.name}</Text>
                {item.is_public && (
                    <View style={s.publicBadge}>
                        <Text style={s.publicBadgeText}>Публичный</Text>
                    </View>
                )}
            </View>
            
            <Text style={s.templateContent} numberOfLines={4}>
                {item.template_data || 'Нет содержимого'}
            </Text>
            
            <View style={s.cardActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)}>
                    <Ionicons name="pencil-outline" size={16} color="#64748b" />
                    <Text style={s.editBtnText}>Изменить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={s.deleteBtnText}>Удалить</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={s.container}>
                <AnimatedGradientBackground />
                <SafeAreaView style={s.safeArea}>
                    <View style={s.loadingContainer}>
                        <ActivityIndicator size="large" color={MINT} />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <AnimatedGradientBackground />
            <SafeAreaView style={s.safeArea}>
                <View style={s.header}>
                    <View>
                        <Text style={s.title}>Шаблоны отчётов</Text>
                        <Text style={s.subtitle}>{templates.length} шаблонов</Text>
                    </View>
                    <TouchableOpacity style={s.addBtn} onPress={openCreate}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={s.addBtnText}>Новый шаблон</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={templates}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={s.listContent}
                    numColumns={1}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
                            <Text style={s.emptyTitle}>Нет шаблонов</Text>
                            <Text style={s.emptySubtitle}>
                                Создайте шаблон для автоматического форматирования отчётов
                            </Text>
                        </View>
                    }
                />

                {/* Create/Edit Modal */}
                <Modal
                    visible={showModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowModal(false)}
                >
                    <View style={s.modalOverlay}>
                        <View style={s.modalContent}>
                            <View style={s.modalHeader}>
                                <Text style={s.modalTitle}>
                                    {editId ? 'Редактирование' : 'Новый шаблон'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={s.modalBody}>
                                <Text style={s.inputLabel}>Название *</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="Название шаблона"
                                    value={form.name}
                                    onChangeText={(text) => setForm({ ...form, name: text })}
                                />

                                <Text style={s.inputLabel}>Содержимое шаблона *</Text>
                                <TextInput
                                    style={[s.input, s.textArea]}
                                    placeholder="Введите текст шаблона..."
                                    value={form.template_data}
                                    onChangeText={(text) => setForm({ ...form, template_data: text })}
                                    multiline
                                    numberOfLines={10}
                                />

                                <View style={s.switchRow}>
                                    <Text style={s.switchLabel}>Публичный шаблон</Text>
                                    <Switch
                                        value={form.is_public}
                                        onValueChange={(value) => setForm({ ...form, is_public: value })}
                                        trackColor={{ false: '#e2e8f0', true: MINT }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            </ScrollView>

                            <View style={s.modalFooter}>
                                <TouchableOpacity
                                    style={s.cancelButton}
                                    onPress={() => setShowModal(false)}
                                >
                                    <Text style={s.cancelButtonText}>Отмена</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.createButton, saving && s.createButtonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={saving}
                                >
                                    <Text style={s.createButtonText}>
                                        {saving ? 'Сохранение...' : (editId ? 'Сохранить' : 'Создать')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    safeArea: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
    },
    title: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
    subtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: MINT,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
    templateCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    templateName: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
    publicBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    publicBadgeText: { fontSize: 11, color: '#1d4ed8', fontWeight: '500' },
    templateContent: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    editBtnText: { fontSize: 13, color: '#64748b' },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    deleteBtnText: { fontSize: 13, color: '#ef4444' },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
    modalBody: { padding: 16 },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#1f2937',
    },
    textArea: {
        minHeight: 200,
        textAlignVertical: 'top',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 8,
    },
    switchLabel: { fontSize: 14, color: '#374151' },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
    createButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: MINT,
        alignItems: 'center',
    },
    createButtonDisabled: { backgroundColor: '#94a3b8' },
    createButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
