'use client'

/**
 * LetterStudio — the guided drafting tool. The citizen writes their own letter
 * within a correct structure; a live preview assembles the final text; export
 * lets them copy / download / print / open in email. Nothing is auto-sent and
 * nothing is stored on our servers — drafting happens entirely in the browser.
 */

import { useMemo, useState } from 'react'
import {
  Copy, Download, Printer, Mail, ExternalLink, Check, ShieldCheck, Info,
} from 'lucide-react'
import {
  LETTER_TEMPLATES, type LetterTemplateId, type LetterContext, type LetterInput,
} from '@/constants/letter-templates'
import { assembleLetter, deriveParliamentaryEmail, mailtoHref } from '@/lib/letter/build'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

const SUBMISSION_URL = 'https://www.parliament.nz/en/pb/sc/make-a-submission/'
const OIA_GUIDE_URL = 'https://www.ombudsman.parliament.nz/'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 9, border: `1px solid ${BORDER}`,
  fontFamily: MANROPE, fontSize: 14, color: INK, background: '#fff', outline: 'none',
}
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, display: 'block', marginBottom: 4 }

export function LetterPreview({ text }: { text: string }) {
  return (
    <pre style={{
      fontFamily: SERIF, fontSize: 14, lineHeight: 1.65, color: '#23262c', whiteSpace: 'pre-wrap',
      wordBreak: 'break-word', margin: 0, background: '#fff', border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: '24px 26px', minHeight: 320,
    }}>
      {text}
    </pre>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function LetterStudio({ templateId, ctx: ctx0 }: { templateId: LetterTemplateId; ctx: LetterContext }) {
  const template = LETTER_TEMPLATES[templateId]

  const [recipientName, setRecipientName] = useState(ctx0.recipientName || '')
  const [recipientRole, setRecipientRole] = useState(ctx0.recipientRole || '')
  const [senderName, setSenderName] = useState('')
  const [senderLocation, setSenderLocation] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [subject, setSubject] = useState(template.defaultSubject(ctx0))
  const [body, setBody] = useState(template.starter(ctx0))
  const [stance, setStance] = useState<'support' | 'oppose' | 'neither'>('support')
  const [appear, setAppear] = useState(false)
  const [copied, setCopied] = useState(false)

  const ctx: LetterContext = { ...ctx0, recipientName, recipientRole }
  const input: LetterInput = { senderName, senderLocation, senderEmail, subject, body, stance, appear }
  const letter = useMemo(() => assembleLetter(template, input, ctx), [template, recipientName, recipientRole, senderName, senderLocation, senderEmail, subject, body, stance, appear]) // eslint-disable-line react-hooks/exhaustive-deps

  const emailSuggestion =
    ctx0.recipientEmail ||
    ((template.recipientKind === 'mp' || template.recipientKind === 'minister') && recipientName
      ? deriveParliamentaryEmail(recipientName)
      : '')

  const copy = async () => {
    try { await navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }
  const download = () => {
    const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${template.id}-letter.txt`; a.click()
    URL.revokeObjectURL(url)
  }
  const print = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<pre style="font-family:Georgia,serif;white-space:pre-wrap;padding:48px;font-size:14px;line-height:1.6">${escapeHtml(letter)}</pre>`)
    w.document.close(); w.focus(); w.print()
  }

  const recipientLabel =
    template.recipientKind === 'agency' ? 'Send to (department / minister / agency)'
    : template.recipientKind === 'committee' ? 'Select committee'
    : 'Recipient'

  return (
    <div>
      {/* Guidance */}
      <div style={{ display: 'flex', gap: 10, padding: '13px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, marginBottom: 18 }}>
        <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
        <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {template.guidance.map((g) => (
            <li key={g} style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, lineHeight: 1.45 }}>{g}</li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>

        {/* ── Form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Recipient */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>To</div>
            <div>
              <label style={labelStyle}>{recipientLabel}</label>
              <input style={inputStyle} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder={template.recipientKind === 'agency' ? 'e.g. Ministry of Health' : 'Name'} />
            </div>
            {template.recipientKind !== 'committee' && (
              <div>
                <label style={labelStyle}>Their role (optional)</label>
                <input style={inputStyle} value={recipientRole} onChange={(e) => setRecipientRole(e.target.value)} placeholder="e.g. MP for Botany" />
              </div>
            )}
          </div>

          {/* Submission extras */}
          {template.id === 'submission' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Your position</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['support', 'oppose', 'neither'] as const).map((s) => (
                  <button key={s} onClick={() => setStance(s)} style={{
                    flex: 1, minWidth: 90, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', fontFamily: MANROPE, fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
                    border: `1.5px solid ${stance === s ? JADE : BORDER}`, background: stance === s ? '#ecfdf5' : '#fff', color: stance === s ? '#065f46' : SECONDARY,
                  }}>{s === 'neither' ? 'Neutral' : s}</button>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: INK, fontFamily: MANROPE, cursor: 'pointer' }}>
                <input type="checkbox" checked={appear} onChange={(e) => setAppear(e.target.checked)} style={{ accentColor: JADE, width: 16, height: 16 }} />
                I’d like to speak to the committee in person
              </label>
            </div>
          )}

          {/* Subject + body */}
          <div>
            <label style={labelStyle}>Subject</label>
            <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Your letter — write it in your own words</label>
            <textarea style={{ ...inputStyle, minHeight: 200, lineHeight: 1.6, resize: 'vertical' }} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          {/* Sender */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Your details</div>
            <div><label style={labelStyle}>Full name</label><input style={inputStyle} value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your name" /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Suburb / city</label><input style={inputStyle} value={senderLocation} onChange={(e) => setSenderLocation(e.target.value)} placeholder="e.g. Botany, Auckland" /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Email (optional)</label><input style={inputStyle} value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="you@example.com" /></div>
            </div>
          </div>
        </div>

        {/* ── Preview + export ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Live preview</div>
          <LetterPreview text={letter} />

          {/* Export */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={copy} style={btn(true)}>{copied ? <Check style={ic} /> : <Copy style={ic} />}{copied ? 'Copied!' : 'Copy'}</button>
            <button onClick={download} style={btn(false)}><Download style={ic} />Download</button>
            <button onClick={print} style={btn(false)}><Printer style={ic} />Print / PDF</button>
            <a href={mailtoHref(emailSuggestion, subject, letter)} style={{ ...btn(false), textDecoration: 'none' }}><Mail style={ic} />Open in email</a>
          </div>

          {/* How to send it */}
          <div style={{ padding: '13px 15px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, fontFamily: MANROPE }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: INK, marginBottom: 6 }}>How to send it</div>
            {template.id === 'submission' ? (
              <p style={{ fontSize: 12.5, color: SECONDARY, lineHeight: 1.55, margin: 0 }}>
                Lodge your submission through the official{' '}
                <a href={SUBMISSION_URL} target="_blank" rel="noopener noreferrer" style={link}>Parliament submission page <ExternalLink style={icSm} /></a>
                {ctx0.committee ? ` (${ctx0.committee} Committee)` : ''}. Check the closing date on the bill’s page before you submit.
              </p>
            ) : template.id === 'oia' ? (
              <p style={{ fontSize: 12.5, color: SECONDARY, lineHeight: 1.55, margin: 0 }}>
                Send this to the agency that holds the information (find their contact on their website). They must reply within 20 working days.
                {' '}<a href={OIA_GUIDE_URL} target="_blank" rel="noopener noreferrer" style={link}>OIA guidance (Ombudsman) <ExternalLink style={icSm} /></a>
              </p>
            ) : (
              <p style={{ fontSize: 12.5, color: SECONDARY, lineHeight: 1.55, margin: 0 }}>
                {emailSuggestion && <>Suggested email (Parliament’s standard format): <b style={{ color: INK }}>{emailSuggestion}</b>. </>}
                Always verify the address on their official page
                {ctx0.recipientUrl && <> — <a href={ctx0.recipientUrl} target="_blank" rel="noopener noreferrer" style={link}>view contact details <ExternalLink style={icSm} /></a></>}.
              </p>
            )}
          </div>

          {/* Privacy */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ShieldCheck style={{ width: 14, height: 14, color: JADE, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>Drafted in your browser. Arapono never stores or sends your letter.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 14, height: 14 }
const icSm: React.CSSProperties = { width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }
const link: React.CSSProperties = { color: JADE, fontWeight: 700, textDecoration: 'none' }
function btn(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: MANROPE,
    padding: '9px 13px', borderRadius: 10, cursor: 'pointer',
    border: `1px solid ${primary ? INK : BORDER}`, background: primary ? INK : '#fff', color: primary ? '#fff' : INK,
  }
}
