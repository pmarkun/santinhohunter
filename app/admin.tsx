import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  AdminUnauthorizedError,
  getAdminCapture,
  hasAdminSession,
  listAdminCaptures,
  loadAdminEvidence,
  loginAdmin,
  logoutAdmin,
  updateAdminCaptureStatus,
  type AdminCapture,
  type AdminCaptureFilters,
  type AdminCaptureList,
  type AdminCaptureStatus,
} from '@/services/adminService';
import { officeLabels, rankingOffices } from '@/data/offices';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { Office } from '@/types/domain';

const PAGE_SIZE = 25;
const EMPTY_LIST: AdminCaptureList = {
  entries: [],
  summary: { confirmed: 0, rejected: 0, withoutEvidence: 0 },
  total: 0,
};

export default function AdminScreen() {
  const [authenticated, setAuthenticated] = useState(
    Platform.OS === 'web' && hasAdminSession(),
  );

  useEffect(() => {
    if (Platform.OS !== 'web') router.replace('/hunt');
  }, []);

  if (Platform.OS !== 'web') return null;
  return (
    <>
      <Head>
        <title>Moderação | Santinho Hunter</title>
        <meta content="noindex,nofollow,noarchive" name="robots" />
      </Head>
      {authenticated ? (
        <AdminDashboard onSessionExpired={() => setAuthenticated(false)} />
      ) : (
        <AdminLogin onAuthenticated={() => setAuthenticated(true)} />
      )}
    </>
  );
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!password || loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await loginAdmin(password);
      onAuthenticated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.loginPage}>
      <View style={styles.loginPanel}>
        <Text style={styles.brand}>SANTINHO HUNTER</Text>
        <Text style={styles.loginKicker}>OPERAÇÃO PRIVADA</Text>
        <Text style={styles.loginTitle}>Moderação de flagrantes</Text>
        <Text style={styles.loginBody}>Entre para revisar evidências e retirar erros do ranking.</Text>
        <TextInput
          accessibilityLabel="Senha administrativa"
          autoCapitalize="none"
          onChangeText={setPassword}
          onSubmitEditing={submit}
          placeholder="Senha administrativa"
          secureTextEntry
          style={styles.loginInput}
          value={password}
        />
        {error ? <Text style={styles.errorBox}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={!password || loading}
          onPress={submit}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          {loading ? <ActivityIndicator color={colors.asphalt} /> : <Text style={styles.primaryLabel}>ENTRAR</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function AdminDashboard({ onSessionExpired }: { onSessionExpired: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [filters, setFilters] = useState<AdminCaptureFilters>({ limit: PAGE_SIZE, offset: 0 });
  const [data, setData] = useState(EMPTY_LIST);
  const [selected, setSelected] = useState<AdminCapture>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [moderationTarget, setModerationTarget] = useState<AdminCaptureStatus>();

  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof AdminUnauthorizedError) {
      onSessionExpired();
      return;
    }
    setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os flagrantes.');
  }, [onSessionExpired]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await listAdminCaptures(filters));
    } catch (cause) {
      handleError(cause);
    } finally {
      setLoading(false);
    }
  }, [filters, handleError]);

  useEffect(() => { load(); }, [load]);

  async function openCapture(id: string) {
    setError(undefined);
    try {
      setSelected(await getAdminCapture(id));
    } catch (cause) {
      handleError(cause);
    }
  }

  async function signOut() {
    await logoutAdmin();
    onSessionExpired();
  }

  async function moderate(reason: string) {
    if (!selected || !moderationTarget) return;
    const previous = selected;
    const optimistic = { ...selected, status: moderationTarget };
    setSelected(optimistic);
    setData((current) => ({
      ...current,
      entries: current.entries.map((entry) => entry.id === selected.id ? optimistic : entry),
    }));
    setModerationTarget(undefined);
    try {
      const updated = await updateAdminCaptureStatus(selected.id, moderationTarget, reason);
      setSelected(updated);
      await load();
    } catch (cause) {
      setSelected(previous);
      setData((current) => ({
        ...current,
        entries: current.entries.map((entry) => entry.id === previous.id ? previous : entry),
      }));
      handleError(cause);
    }
  }

  return (
    <View style={styles.adminPage}>
      <View style={styles.adminTopbar}>
        <View>
          <Text style={styles.brand}>SANTINHO HUNTER</Text>
          <Text style={styles.adminTitle}>Moderação</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={signOut} style={styles.iconTextButton}>
          <MaterialCommunityIcons color={colors.asphalt} name="logout" size={20} />
          {!compact ? <Text style={styles.iconTextLabel}>Sair</Text> : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.adminContent}>
        <Summary data={data} compact={compact} />
        <Filters filters={filters} onChange={setFilters} />
        {error ? <Text style={styles.errorBox}>{error}</Text> : null}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>FLAGRANTES</Text>
          <Text style={styles.resultCount}>{data.total} registros</Text>
        </View>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator color={colors.red} /><Text>Carregando registros...</Text></View>
        ) : data.entries.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyTitle}>Nenhum flagra encontrado.</Text><Text>Ajuste os filtros e tente novamente.</Text></View>
        ) : (
          data.entries.map((capture) => (
            <CaptureRow capture={capture} compact={compact} key={capture.id} onPress={() => openCapture(capture.id)} />
          ))
        )}
        <Pagination filters={filters} onChange={setFilters} total={data.total} />
      </ScrollView>

      <Modal animationType="fade" onRequestClose={() => setSelected(undefined)} transparent visible={Boolean(selected)}>
        <View style={styles.modalBackdrop}>
          {selected ? (
            <CaptureDetail
              capture={selected}
              compact={compact}
              onClose={() => setSelected(undefined)}
              onModerate={(status) => setModerationTarget(status)}
            />
          ) : null}
        </View>
      </Modal>
      <ReasonModal
        onCancel={() => setModerationTarget(undefined)}
        onConfirm={moderate}
        status={moderationTarget}
      />
    </View>
  );
}

function Summary({ data, compact }: { data: AdminCaptureList; compact: boolean }) {
  const entries = [
    ['CONFIRMADOS', data.summary.confirmed, colors.green],
    ['INVALIDADOS', data.summary.rejected, colors.red],
    ['SEM EVIDÊNCIA', data.summary.withoutEvidence, colors.muted],
  ] as const;
  return <View style={[styles.summary, compact && styles.summaryCompact]}>{entries.map(([label, value, color]) => <View key={label} style={styles.summaryItem}><Text style={[styles.summaryValue, { color }]}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>)}</View>;
}

function Filters({ filters, onChange }: { filters: AdminCaptureFilters; onChange: (next: AdminCaptureFilters) => void }) {
  function patch(next: Partial<AdminCaptureFilters>) { onChange({ ...filters, ...next, offset: 0 }); }
  return (
    <View style={styles.filters}>
      <Text style={styles.sectionTitle}>FILTROS</Text>
      <View style={styles.segmentRow}>
        <FilterChip active={!filters.status} label="Todos" onPress={() => patch({ status: undefined })} />
        <FilterChip active={filters.status === 'confirmed'} label="Confirmados" onPress={() => patch({ status: 'confirmed' })} />
        <FilterChip active={filters.status === 'rejected'} label="Invalidados" onPress={() => patch({ status: 'rejected' })} />
      </View>
      <View style={styles.filterFields}>
        <FilterInput label="UF" maxLength={2} onChangeText={(value) => patch({ uf: value.toUpperCase() || undefined })} value={filters.uf ?? ''} />
        <FilterInput label="ID do flagra" onChangeText={(value) => patch({ query: value || undefined })} value={filters.query ?? ''} />
        <FilterInput label="ID do candidato" onChangeText={(value) => patch({ candidateId: value || undefined })} value={filters.candidateId ?? ''} />
        <FilterInput label="Desde (ISO)" onChangeText={(value) => patch({ from: value || undefined })} value={filters.from ?? ''} />
        <FilterInput label="Até (ISO)" onChangeText={(value) => patch({ to: value || undefined })} value={filters.to ?? ''} />
      </View>
      <View style={styles.segmentRow}>
        <FilterChip active={!filters.office} label="Todos os cargos" onPress={() => patch({ office: undefined })} />
        {rankingOffices.map((office) => <FilterChip active={filters.office === office} key={office} label={officeLabels[office]} onPress={() => patch({ office })} />)}
      </View>
    </View>
  );
}

function FilterInput(props: { label: string; value: string; onChangeText: (value: string) => void; maxLength?: number }) {
  return <View style={styles.filterInputWrap}><Text style={styles.fieldLabel}>{props.label}</Text><TextInput {...props} placeholderTextColor={colors.muted} style={styles.filterInput} /></View>;
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}><Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>{label}</Text></Pressable>;
}

function CaptureRow({ capture, compact, onPress }: { capture: AdminCapture; compact: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.captureRow, pressed && styles.rowPressed]}>
      <PrivateEvidence capture={capture} style={styles.thumbnail} />
      <View style={styles.captureMain}>
        <View style={styles.captureMeta}><StatusBadge status={capture.status} /><Text style={styles.metaText}>{formatDate(capture.capturedAt)} · {capture.city ?? capture.uf}</Text></View>
        <Text style={styles.candidateNames}>{capture.candidates.map(({ candidate }) => `${candidate.ballotName} · ${candidate.party}`).join(' + ') || 'Sem candidato associado'}</Text>
        <Text numberOfLines={compact ? 1 : 2} style={styles.captureId}>{capture.clientCaptureId}</Text>
      </View>
      <MaterialCommunityIcons color={colors.asphalt} name="chevron-right" size={24} />
    </Pressable>
  );
}

function CaptureDetail({ capture, compact, onClose, onModerate }: { capture: AdminCapture; compact: boolean; onClose: () => void; onModerate: (status: AdminCaptureStatus) => void }) {
  const nextStatus = capture.status === 'confirmed' ? 'rejected' : 'confirmed';
  return (
    <View style={[styles.detail, compact && styles.detailCompact]}>
      <View style={styles.detailHeader}><View><Text style={styles.sectionTitle}>FLAGRANTE</Text><StatusBadge status={capture.status} /></View><Pressable accessibilityLabel="Fechar detalhe" accessibilityRole="button" onPress={onClose} style={styles.iconButton}><MaterialCommunityIcons color={colors.asphalt} name="close" size={26} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <PrivateEvidence capture={capture} style={styles.evidence} />
        <DetailSection title="Candidatos">{capture.candidates.map(({ candidate, confidence }) => <View key={candidate.id} style={styles.candidateDetail}>{candidate.photoUrl ? <Image source={{ uri: candidate.photoUrl }} style={styles.candidatePhoto} /> : null}<View style={styles.captureMain}><Text style={styles.candidateNames}>{candidate.ballotName}</Text><Text style={styles.metaText}>{candidate.number} · {candidate.party} · {officeLabels[candidate.office]}</Text>{confidence != null ? <Text style={styles.confidence}>{Math.round(confidence * 100)}% de confiança</Text> : null}</View></View>)}</DetailSection>
        <DetailSection title="Registro"><DetailLine label="Capturado" value={formatDate(capture.capturedAt)} /><DetailLine label="Local" value={`${capture.city ?? capture.uf}${capture.latitudeApprox != null ? ` · ${capture.latitudeApprox}, ${capture.longitudeApprox}` : ''}`} /><DetailLine label="Origem" value={capture.source} /><DetailLine label="ID servidor" value={capture.id} /><DetailLine label="ID aparelho" value={capture.clientCaptureId} /></DetailSection>
        <DetailSection title="Histórico">{capture.moderationEvents.length ? capture.moderationEvents.map((event) => <View key={event.id} style={styles.event}><Text style={styles.eventTitle}>{event.newStatus === 'rejected' ? 'INVALIDADO' : 'RESTAURADO'} · {formatDate(event.createdAt)}</Text><Text style={styles.eventReason}>{event.reason}</Text></View>) : <Text style={styles.metaText}>Nenhuma ação administrativa.</Text>}</DetailSection>
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={() => onModerate(nextStatus)} style={[styles.moderateButton, nextStatus === 'rejected' ? styles.rejectButton : styles.restoreButton]}><MaterialCommunityIcons color={colors.paper} name={nextStatus === 'rejected' ? 'cancel' : 'backup-restore'} size={21} /><Text style={styles.moderateLabel}>{nextStatus === 'rejected' ? 'INVALIDAR FLAGRANTE' : 'RESTAURAR FLAGRANTE'}</Text></Pressable>
    </View>
  );
}

function PrivateEvidence({ capture, style }: { capture: AdminCapture; style: object }) {
  const [uri, setUri] = useState<string>();
  useEffect(() => {
    if (!capture.evidenceAvailable) return;
    let active = true;
    let objectUrl: string | undefined;
    loadAdminEvidence(capture.id).then((next) => { objectUrl = next; if (active) setUri(next); }).catch(() => undefined);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [capture.evidenceAvailable, capture.id]);
  if (uri) return <Image resizeMode="cover" source={{ uri }} style={style} />;
  return <View style={[style, styles.evidenceMissing]}><MaterialCommunityIcons color={colors.muted} name={capture.evidenceAvailable ? 'loading' : 'image-off-outline'} size={24} /><Text style={styles.evidenceMissingText}>{capture.evidenceAvailable ? 'Carregando' : 'Sem foto'}</Text></View>;
}

function ReasonModal({ status, onCancel, onConfirm }: { status: AdminCaptureStatus | undefined; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (!status) setReason(''); }, [status]);
  return <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(status)}><View style={styles.modalBackdrop}><View style={styles.reasonPanel}><Text style={styles.loginKicker}>{status === 'rejected' ? 'INVALIDAR' : 'RESTAURAR'}</Text><Text style={styles.reasonTitle}>Registre o motivo</Text><TextInput autoFocus multiline onChangeText={setReason} placeholder="Explique a decisão em pelo menos 3 caracteres" style={styles.reasonInput} value={reason} /><View style={styles.reasonActions}><Pressable onPress={onCancel} style={styles.secondaryButton}><Text style={styles.secondaryLabel}>CANCELAR</Text></Pressable><Pressable disabled={reason.trim().length < 3} onPress={() => onConfirm(reason.trim())} style={[styles.primaryButton, reason.trim().length < 3 && styles.disabled]}><Text style={styles.primaryLabel}>CONFIRMAR</Text></Pressable></View></View></View></Modal>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.detailSection}><Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>{children}</View>; }
function DetailLine({ label, value }: { label: string; value: string }) { return <View style={styles.detailLine}><Text style={styles.detailLabel}>{label}</Text><Text selectable style={styles.detailValue}>{value}</Text></View>; }
function StatusBadge({ status }: { status: AdminCaptureStatus }) { return <View style={[styles.badge, status === 'confirmed' ? styles.confirmedBadge : styles.rejectedBadge]}><Text style={styles.badgeText}>{status === 'confirmed' ? 'CONFIRMADO' : 'INVALIDADO'}</Text></View>; }

function Pagination({ filters, total, onChange }: { filters: AdminCaptureFilters; total: number; onChange: (next: AdminCaptureFilters) => void }) {
  const page = Math.floor(filters.offset / filters.limit) + 1;
  const pages = Math.max(1, Math.ceil(total / filters.limit));
  return <View style={styles.pagination}><Pressable disabled={filters.offset === 0} onPress={() => onChange({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })} style={[styles.pageButton, filters.offset === 0 && styles.disabled]}><MaterialCommunityIcons name="chevron-left" size={22} /></Pressable><Text style={styles.pageLabel}>{page} / {pages}</Text><Pressable disabled={filters.offset + filters.limit >= total} onPress={() => onChange({ ...filters, offset: filters.offset + filters.limit })} style={[styles.pageButton, filters.offset + filters.limit >= total && styles.disabled]}><MaterialCommunityIcons name="chevron-right" size={22} /></Pressable></View>;
}

function formatDate(value: string): string { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }

const styles = StyleSheet.create({
  adminContent: { alignSelf: 'center', maxWidth: 1180, padding: spacing.xl, width: '100%' },
  adminPage: { backgroundColor: colors.newsprint, flex: 1 },
  adminTitle: { fontFamily: fontFamilies.display, fontSize: 28, fontWeight: '900' },
  adminTopbar: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.asphalt, borderBottomWidth: 2, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  badge: { alignSelf: 'flex-start', borderRadius: radii.sm, paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { color: colors.paper, fontFamily: fontFamilies.display, fontSize: 10, fontWeight: '900' },
  brand: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 16, fontWeight: '900' },
  candidateDetail: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  candidateNames: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 16, fontWeight: '900' },
  candidatePhoto: { borderRadius: radii.sm, height: 54, width: 44 },
  captureId: { color: colors.muted, fontFamily: 'monospace', fontSize: 11, marginTop: spacing.sm },
  captureMain: { flex: 1, gap: spacing.xs, minWidth: 0 },
  captureMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  captureRow: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 100, paddingVertical: spacing.md },
  confidence: { color: colors.green, fontSize: 12, fontWeight: '800' },
  confirmedBadge: { backgroundColor: colors.green },
  detail: { backgroundColor: colors.paper, borderLeftColor: colors.asphalt, borderLeftWidth: 2, height: '100%', marginLeft: 'auto', maxWidth: 620, width: '92%' },
  detailCompact: { borderLeftWidth: 0, width: '100%' },
  detailContent: { padding: spacing.xl },
  detailHeader: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  detailLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', width: 100 },
  detailLine: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  detailSection: { borderTopColor: colors.asphalt, borderTopWidth: 2, gap: spacing.sm, marginTop: spacing.xl, paddingTop: spacing.md },
  detailValue: { color: colors.asphalt, flex: 1, fontSize: 13 },
  disabled: { opacity: 0.35 },
  empty: { alignItems: 'center', borderColor: colors.line, borderWidth: 1, gap: spacing.sm, padding: spacing.xxl },
  emptyTitle: { fontFamily: fontFamilies.display, fontSize: 20, fontWeight: '900' },
  errorBox: { borderColor: colors.red, borderWidth: 1, color: colors.red, fontSize: 13, fontWeight: '800', padding: spacing.md },
  event: { borderLeftColor: colors.red, borderLeftWidth: 3, gap: spacing.xs, paddingLeft: spacing.md, paddingVertical: spacing.sm },
  eventReason: { color: colors.asphalt, fontSize: 13 },
  eventTitle: { color: colors.red, fontSize: 11, fontWeight: '900' },
  evidence: { aspectRatio: 4 / 3, backgroundColor: '#ECECE8', borderRadius: radii.sm, width: '100%' },
  evidenceMissing: { alignItems: 'center', backgroundColor: '#ECECE8', justifyContent: 'center' },
  evidenceMissingText: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: spacing.xs, textTransform: 'uppercase' },
  fieldLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  filterChip: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 9 },
  filterChipActive: { backgroundColor: colors.asphalt, borderColor: colors.asphalt },
  filterChipLabel: { color: colors.asphalt, fontSize: 12, fontWeight: '800' },
  filterChipLabelActive: { color: colors.paper },
  filterFields: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  filterInput: { borderBottomColor: colors.asphalt, borderBottomWidth: 1, color: colors.asphalt, fontSize: 14, minHeight: 38, paddingVertical: spacing.sm },
  filterInputWrap: { flexGrow: 1, minWidth: 140 },
  filters: { borderBottomColor: colors.asphalt, borderBottomWidth: 2, borderTopColor: colors.asphalt, borderTopWidth: 2, gap: spacing.md, marginVertical: spacing.xl, paddingVertical: spacing.lg },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  iconTextButton: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md },
  iconTextLabel: { fontWeight: '800' },
  listHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  loading: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl },
  loginBody: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  loginInput: { borderColor: colors.asphalt, borderWidth: 2, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.md },
  loginKicker: { color: colors.red, fontSize: 12, fontWeight: '900' },
  loginPage: { alignItems: 'center', backgroundColor: colors.alert, flex: 1, justifyContent: 'center', padding: spacing.xl },
  loginPanel: { backgroundColor: colors.paper, borderColor: colors.asphalt, borderWidth: 2, gap: spacing.lg, maxWidth: 460, padding: spacing.xxl, width: '100%' },
  loginTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 36, fontWeight: '900', lineHeight: 39 },
  metaText: { color: colors.muted, fontSize: 12 },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.52)', flex: 1, justifyContent: 'center' },
  moderateButton: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 58, paddingHorizontal: spacing.lg },
  moderateLabel: { color: colors.paper, fontFamily: fontFamilies.display, fontSize: 15, fontWeight: '900' },
  pageButton: { alignItems: 'center', borderColor: colors.asphalt, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  pageLabel: { fontWeight: '800' },
  pagination: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'center', paddingVertical: spacing.xl },
  pressed: { opacity: 0.82 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.alert, justifyContent: 'center', minHeight: 52, paddingHorizontal: spacing.xl },
  primaryLabel: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 15, fontWeight: '900' },
  reasonActions: { flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' },
  reasonInput: { borderColor: colors.asphalt, borderWidth: 1, fontSize: 14, minHeight: 110, padding: spacing.md, textAlignVertical: 'top' },
  reasonPanel: { alignSelf: 'center', backgroundColor: colors.paper, gap: spacing.lg, maxWidth: 520, padding: spacing.xl, width: '92%' },
  reasonTitle: { fontFamily: fontFamilies.display, fontSize: 28, fontWeight: '900' },
  rejectButton: { backgroundColor: colors.red },
  rejectedBadge: { backgroundColor: colors.red },
  restoreButton: { backgroundColor: colors.green },
  resultCount: { color: colors.muted, fontSize: 13 },
  rowPressed: { backgroundColor: '#F5F5F1' },
  secondaryButton: { alignItems: 'center', borderColor: colors.asphalt, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: spacing.xl },
  secondaryLabel: { color: colors.asphalt, fontWeight: '900' },
  sectionTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 12, fontWeight: '900' },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row' },
  summaryCompact: { flexWrap: 'wrap' },
  summaryItem: { flexGrow: 1, minWidth: 150, paddingVertical: spacing.lg },
  summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  summaryValue: { fontFamily: fontFamilies.display, fontSize: 38, fontWeight: '900' },
  thumbnail: { backgroundColor: '#ECECE8', borderRadius: radii.sm, height: 76, width: 76 },
});
