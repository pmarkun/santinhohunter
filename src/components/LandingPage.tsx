import { MaterialCommunityIcons } from '@expo/vector-icons';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { fetchPublicRanking } from '@/services/rankingService';
import { getLandingCtas, type LandingCtaAction } from '@/services/landingCta';
import { usePwaInstall } from '@/services/pwaInstall';
import { getStoredUf } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';
import type { RankingEntry, Uf } from '@/types/domain';

const heroImage = require('../../assets/landing-hero.jpg');
const appPreview = require('../../assets/landing-app-preview.png');
const huntQrCode = require('../../assets/landing-hunt-qr.png');

const playStoreUrl = 'https://play.google.com/store/apps/details?id=br.com.santinhohunter.app';
const playStoreEnabled = process.env.EXPO_PUBLIC_PLAY_STORE_ENABLED === 'true';

type LandingPageProps = {
  canInstall?: boolean;
  onInstall?: () => Promise<void>;
};

export function LandingPage({ canInstall = false, onInstall }: LandingPageProps) {
  const { height, width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isAndroid = useMemo(
    () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent),
    [],
  );
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingLoaded, setRankingLoaded] = useState(false);
  const [uf, setUf] = useState<Uf>('SP');
  const [consultedAt, setConsultedAt] = useState<Date | null>(null);
  const pwaInstall = usePwaInstall();
  const installAvailable = canInstall || pwaInstall.canInstall;

  useEffect(() => {
    let active = true;

    async function loadRanking() {
      const storedUf = await getStoredUf();
      const entries = await fetchPublicRanking({ uf: storedUf, office: 'federal_deputy' });
      if (active) {
        setUf(storedUf);
        setRanking(entries.slice(0, 3));
        setConsultedAt(new Date());
        setRankingLoaded(true);
      }
    }

    loadRanking();
    return () => {
      active = false;
    };
  }, []);

  const ctas = getLandingCtas({
    canInstall: installAvailable,
    isAndroid,
    isDesktop,
    playStoreEnabled,
  });
  const heroHeight = isDesktop
    ? Math.min(Math.max(height - 56, 640), 780)
    : Math.min(Math.max(height * 0.8, 620), 740);

  async function runAction(action: LandingCtaAction) {
    if (action === 'open_play_store') {
      await Linking.openURL(playStoreUrl);
      return;
    }
    if (action === 'install_pwa') {
      if (onInstall) {
        await onInstall();
      } else {
        await pwaInstall.install();
      }
      return;
    }
    router.push('/(tabs)/hunt');
  }

  function scrollTo(nativeId: string) {
    if (typeof document !== 'undefined') {
      document.getElementById(nativeId)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <>
      <Head>
        <title>Caçadores de Santinhos | Santinho Hunter</title>
        <meta
          content="Fotografe santinhos eleitorais jogados na rua, identifique os candidatos e ajude a construir o ranking público da sujeira."
          name="description"
        />
        <link href="https://santinhohunter.com.br/" rel="canonical" />
        <meta content="Caçadores de Santinhos" property="og:title" />
        <meta
          content="Cace, registre e conte o lixo eleitoral nas ruas."
          property="og:description"
        />
        <meta content="https://santinhohunter.com.br/" property="og:url" />
        <meta content="website" property="og:type" />
        <meta
          content="https://santinhohunter.com.br/assets/landing-hero.jpg"
          property="og:image"
        />
        <meta content="summary_large_image" name="twitter:card" />
      </Head>

      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <ImageBackground
          accessibilityLabel="Santinhos eleitorais descartados em uma calçada"
          source={heroImage}
          style={[styles.hero, { minHeight: heroHeight }]}
          imageStyle={styles.heroImage}
        >
          <View style={styles.header}>
            <Pressable accessibilityRole="link" onPress={() => scrollTo('topo')}>
              <Text style={styles.brand}>Santinho Hunter</Text>
            </Pressable>
            {isDesktop ? (
              <View style={styles.nav}>
                <Pressable onPress={() => scrollTo('como-funciona')}>
                  <Text style={styles.navLink}>Como funciona</Text>
                </Pressable>
                <Pressable onPress={() => scrollTo('ranking')}>
                  <Text style={styles.navLink}>Ranking</Text>
                </Pressable>
                <Pressable onPress={() => scrollTo('transparencia')}>
                  <Text style={styles.navLink}>Transparência</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View nativeID="topo" style={styles.heroBody}>
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
              Caçadores de Santinhos
            </Text>
            <Text style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
              Toda eleição é a mesma coisa. Milhares de papéis espalhados pela cidade,
              sujando as ruas em busca de votos. Junte-se aos Caçadores de Santinhos e
              ajude a denunciar.
            </Text>
            <View style={styles.heroActions}>
              <LandingButton
                label={ctas.primary.label}
                onPress={() => runAction(ctas.primary.action)}
                primary
              />
              {ctas.secondary.map((cta) => (
                <LandingButton
                  key={cta.action}
                  label={cta.label}
                  onPress={() => runAction(cta.action)}
                />
              ))}
            </View>
          </View>

          <Pressable
            accessibilityLabel="Ir para Como funciona"
            onPress={() => scrollTo('como-funciona')}
            style={styles.heroNext}
          >
            <MaterialCommunityIcons color={colors.asphalt} name="arrow-down" size={25} />
          </Pressable>
        </ImageBackground>

        <View nativeID="como-funciona" style={styles.section}>
          <View style={styles.sectionInner}>
            <Text style={styles.sectionNumber}>01</Text>
            <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
              A rua vira evidência
            </Text>
            <Text style={styles.sectionLead}>
              Três passos rápidos para transformar lixo eleitoral em fiscalização pública.
            </Text>
            <View style={[styles.steps, isDesktop && styles.stepsDesktop]}>
              <Step
                icon="camera"
                number="1"
                text="Abra a câmera e fotografe o santinho onde ele foi encontrado."
                title="Flagre"
              />
              <Step
                icon="face-recognition"
                number="2"
                text="Confira os candidatos identificados ou procure pelo número."
                title="Identifique"
              />
              <Step
                icon="send-check"
                number="3"
                text="Confirme os envolvidos e envie a evidência para o ranking."
                title="Denuncie"
              />
            </View>
          </View>
        </View>

        <View style={styles.productBand}>
          <View style={[styles.productInner, isDesktop && styles.productInnerDesktop]}>
            <View style={styles.productCopy}>
              <Text style={styles.sectionNumber}>02</Text>
              <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                Feito para a rua
              </Text>
              <Text style={styles.sectionLead}>
                A jornada principal cabe na mão: capturar, revisar e confirmar sem preencher
                formulário comprido.
              </Text>
              <LandingButton label="Começar um flagrante" onPress={() => runAction('open_app')} primary />
            </View>
            <View style={styles.phoneFrame}>
              <Image
                accessibilityLabel="Tela inicial do Santinho Hunter"
                resizeMode="cover"
                source={appPreview}
                style={styles.phoneImage}
              />
            </View>
          </View>
        </View>

        <View nativeID="ranking" style={styles.section}>
          <View style={styles.sectionInner}>
            <Text style={styles.sectionNumber}>03</Text>
            <View style={[styles.rankingHeading, isDesktop && styles.rankingHeadingDesktop]}>
              <View style={styles.rankingTitleWrap}>
                <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
                  Ranking da sujeira
                </Text>
                <Text style={styles.sectionLead}>
                  Deputados federais com mais santinhos encontrados em {uf}.
                </Text>
              </View>
              <View style={styles.rankingMeta}>
                <Text style={styles.rankingUf}>{uf}</Text>
                <Text style={styles.rankingTime}>
                  {consultedAt
                    ? `Consulta às ${consultedAt.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Consultando dados públicos'}
                </Text>
              </View>
            </View>

            <View style={styles.rankingList}>
              {!rankingLoaded ? (
                <Text style={styles.rankingEmpty}>Consultando o ranking público...</Text>
              ) : ranking.length === 0 ? (
                <Text style={styles.rankingEmpty}>
                  Ainda não há flagrantes confirmados neste ranking.
                </Text>
              ) : (
                ranking.map((entry, index) => (
                  <LandingRankingRow entry={entry} key={entry.candidate.id} position={index + 1} />
                ))
              )}
            </View>
            <Pressable onPress={() => router.push('/(tabs)/ranking')} style={styles.textLinkWrap}>
              <Text style={styles.textLink}>Ver ranking completo</Text>
              <MaterialCommunityIcons color={colors.asphalt} name="arrow-right" size={21} />
            </Pressable>
          </View>
        </View>

        <View nativeID="transparencia" style={styles.transparencyBand}>
          <View style={[styles.transparencyInner, isDesktop && styles.transparencyInnerDesktop]}>
            <View style={styles.transparencyCopy}>
              <Text style={styles.redLabel}>TRANSPARÊNCIA</Text>
              <Text style={[styles.transparencyTitle, isDesktop && styles.transparencyTitleDesktop]}>
                Fiscalização cidadã, sem palanque escondido.
              </Text>
              <Text style={styles.transparencyText}>
                A base de candidatos vem do TSE. A localização é aproximada antes de qualquer
                uso público. O reconhecimento compara apenas com candidatos e a foto bruta não
                aparece em galeria aberta.
              </Text>
              <Text style={styles.transparencyText}>
                O Santinho Hunter é independente de governos, partidos, candidaturas,
                coligações e federações.
              </Text>
            </View>
            {isDesktop ? (
              <View style={styles.qrPanel}>
                <Image accessibilityLabel="QR Code para abrir o app" source={huntQrCode} style={styles.qrImage} />
                <Text style={styles.qrTitle}>Leve para a rua</Text>
                <Text style={styles.qrCopy}>Aponte a câmera do celular e abra o app.</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.footerInner, isDesktop && styles.footerInnerDesktop]}>
            <View>
              <Text style={styles.footerBrand}>Santinho Hunter</Text>
              <Text style={styles.footerCopy}>Eleição Geral 2026 · Projeto independente</Text>
            </View>
            <View style={styles.footerLinks}>
              <FooterLink href="/sobre" label="Sobre" />
              <FooterLink href="/politica-de-privacidade" label="Privacidade" />
              <FooterLink href="/termos-de-uso" label="Termos" />
              <FooterLink href="/exclusao-de-dados" label="Exclusão de dados" />
              <Pressable onPress={() => Linking.openURL('mailto:pedro@markun.com.br')}>
                <Text style={styles.footerLink}>Contato</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function LandingButton({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonLabel, !primary && styles.buttonSecondaryLabel]}>{label}</Text>
      <MaterialCommunityIcons color={colors.asphalt} name="arrow-right" size={21} />
    </Pressable>
  );
}

function Step({ icon, number, text, title }: { icon: string; number: string; text: string; title: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>{number}</Text>
        <MaterialCommunityIcons color={colors.asphalt} name={icon as never} size={31} />
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function LandingRankingRow({ entry, position }: { entry: RankingEntry; position: number }) {
  return (
    <View style={styles.rankingRow}>
      <Text style={styles.rankingPosition}>{position}</Text>
      {entry.candidate.photoUrl ? (
        <Image source={{ uri: entry.candidate.photoUrl }} style={styles.rankingPhoto} />
      ) : (
        <View style={styles.rankingPhotoFallback}>
          <MaterialCommunityIcons color={colors.muted} name="account" size={28} />
        </View>
      )}
      <View style={styles.rankingBody}>
        <Text style={styles.rankingName}>{entry.candidate.ballotName}</Text>
        <Text style={styles.rankingCandidateMeta}>
          {entry.candidate.number} · {entry.candidate.party}
        </Text>
      </View>
      <View style={styles.rankingCountWrap}>
        <Text style={styles.rankingCount}>{entry.count}</Text>
        <Text style={styles.rankingCountLabel}>santinhos</Text>
      </View>
    </View>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Pressable onPress={() => router.push(href as never)}>
      <Text style={styles.footerLink}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.paper, flex: 1 },
  pageContent: { backgroundColor: colors.paper },
  hero: { justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 28 },
  heroImage: { backgroundColor: '#D7D7D2' },
  header: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.paper,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    maxWidth: 1200,
    minHeight: 54,
    paddingHorizontal: 18,
    width: '100%',
  },
  brand: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  nav: { alignItems: 'center', flexDirection: 'row', gap: 26 },
  navLink: { color: colors.asphalt, fontSize: 14, fontWeight: '800' },
  heroBody: { alignSelf: 'center', maxWidth: 1200, paddingBottom: 34, width: '100%' },
  heroTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 47, fontWeight: '900', lineHeight: 48, maxWidth: 700, textTransform: 'uppercase' },
  heroTitleDesktop: { fontSize: 76, lineHeight: 75 },
  heroCopy: { color: colors.asphalt, fontSize: 16, fontWeight: '700', lineHeight: 23, marginTop: 18, maxWidth: 610 },
  heroCopyDesktop: { fontSize: 19, lineHeight: 27 },
  heroActions: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  heroNext: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.alert, height: 44, justifyContent: 'center', width: 44 },
  button: { alignItems: 'center', flexDirection: 'row', gap: 20, justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 18 },
  buttonPrimary: { backgroundColor: colors.alert, minWidth: 210 },
  buttonSecondary: { backgroundColor: colors.paper, borderColor: colors.asphalt, borderWidth: 1 },
  buttonPressed: { opacity: 0.72 },
  buttonLabel: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  buttonSecondaryLabel: { fontSize: 13 },
  section: { backgroundColor: colors.paper, paddingHorizontal: 20, paddingVertical: 76 },
  sectionInner: { alignSelf: 'center', maxWidth: 1120, width: '100%' },
  sectionNumber: { color: colors.red, fontFamily: fontFamilies.display, fontSize: 14, fontWeight: '900', marginBottom: 10 },
  sectionTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 38, fontWeight: '900', lineHeight: 39, maxWidth: 820, textTransform: 'uppercase' },
  sectionTitleDesktop: { fontSize: 58, lineHeight: 58 },
  sectionLead: { color: colors.steel, fontSize: 17, lineHeight: 25, marginTop: 16, maxWidth: 620 },
  steps: { borderTopColor: colors.asphalt, borderTopWidth: 2, marginTop: 40 },
  stepsDesktop: { flexDirection: 'row' },
  step: { borderBottomColor: colors.line, borderBottomWidth: 1, flex: 1, minHeight: 220, paddingHorizontal: 18, paddingVertical: 22 },
  stepHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  stepNumber: { color: colors.red, fontFamily: fontFamilies.display, fontSize: 18, fontWeight: '900' },
  stepTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 27, fontWeight: '900', marginTop: 34, textTransform: 'uppercase' },
  stepText: { color: colors.steel, fontSize: 15, lineHeight: 22, marginTop: 10 },
  productBand: { backgroundColor: '#F1F1ED', paddingHorizontal: 20, paddingVertical: 76 },
  productInner: { alignItems: 'center', alignSelf: 'center', gap: 48, maxWidth: 1040, width: '100%' },
  productInnerDesktop: { flexDirection: 'row', justifyContent: 'space-between' },
  productCopy: { alignItems: 'flex-start', flex: 1, maxWidth: 560 },
  phoneFrame: { backgroundColor: colors.asphalt, borderColor: colors.asphalt, borderRadius: 8, borderWidth: 8, height: 568, overflow: 'hidden', width: 284 },
  phoneImage: { height: '100%', width: '100%' },
  rankingHeading: { gap: 24 },
  rankingHeadingDesktop: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  rankingTitleWrap: { flex: 1 },
  rankingMeta: { alignItems: 'flex-start', minWidth: 130 },
  rankingUf: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 46, fontWeight: '900' },
  rankingTime: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  rankingList: { borderTopColor: colors.asphalt, borderTopWidth: 2, marginTop: 34, minHeight: 100 },
  rankingEmpty: { color: colors.muted, fontSize: 16, fontWeight: '700', paddingVertical: 36 },
  rankingRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: 12, minHeight: 104, paddingVertical: 12 },
  rankingPosition: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 34, fontWeight: '900', minWidth: 26 },
  rankingPhoto: { backgroundColor: '#EFEFEF', height: 70, width: 60 },
  rankingPhotoFallback: { alignItems: 'center', backgroundColor: '#EFEFEF', height: 70, justifyContent: 'center', width: 60 },
  rankingBody: { flex: 1 },
  rankingName: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 19, fontWeight: '900', lineHeight: 21, textTransform: 'uppercase' },
  rankingCandidateMeta: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  rankingCountWrap: { alignItems: 'flex-end' },
  rankingCount: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 32, fontWeight: '900' },
  rankingCountLabel: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  textLinkWrap: { alignItems: 'center', alignSelf: 'flex-start', borderBottomColor: colors.asphalt, borderBottomWidth: 1, flexDirection: 'row', gap: 10, marginTop: 26, paddingBottom: 4 },
  textLink: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  transparencyBand: { backgroundColor: colors.asphalt, paddingHorizontal: 20, paddingVertical: 76 },
  transparencyInner: { alignSelf: 'center', gap: 50, maxWidth: 1120, width: '100%' },
  transparencyInnerDesktop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  transparencyCopy: { flex: 1, maxWidth: 720 },
  redLabel: { color: '#FF3B42', fontFamily: fontFamilies.display, fontSize: 14, fontWeight: '900' },
  transparencyTitle: { color: colors.paper, fontFamily: fontFamilies.display, fontSize: 38, fontWeight: '900', lineHeight: 40, marginTop: 12, textTransform: 'uppercase' },
  transparencyTitleDesktop: { fontSize: 56, lineHeight: 57 },
  transparencyText: { color: '#E4E4E1', fontSize: 16, lineHeight: 24, marginTop: 18 },
  qrPanel: { alignItems: 'center', backgroundColor: colors.paper, padding: 24, width: 260 },
  qrImage: { height: 176, width: 176 },
  qrTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 22, fontWeight: '900', marginTop: 14, textTransform: 'uppercase' },
  qrCopy: { color: colors.steel, fontSize: 13, lineHeight: 18, marginTop: 4, textAlign: 'center' },
  footer: { backgroundColor: colors.alert, paddingHorizontal: 20, paddingVertical: 34 },
  footerInner: { alignSelf: 'center', gap: 28, maxWidth: 1120, width: '100%' },
  footerInnerDesktop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  footerBrand: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },
  footerCopy: { color: colors.asphalt, fontSize: 12, fontWeight: '700', marginTop: 4 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  footerLink: { color: colors.asphalt, fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
});
