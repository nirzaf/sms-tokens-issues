import { useMemo } from 'react';
import type {
  SemanticFieldId,
  TemplateLanguage,
  TokenOccurrenceIssue,
  TokenVisualSeverity,
} from '../types/sms';
import { tokenizeTemplateBody } from '../utils/templateParser';

interface VerbatimTemplateBodyProps {
  body: string;
  language: TemplateLanguage;
  tokenMap: Record<string, TokenOccurrenceIssue>;
  selectedFieldId: SemanticFieldId | null;
  selectedToken: string | null;
  selectedLanguage: TemplateLanguage | null;
  onTokenClick: (token: string, fieldId: SemanticFieldId, language: TemplateLanguage) => void;
}

const SEVERITY_CLASS: Record<TokenVisualSeverity, string> = {
  consistent: '',
  drift: 'sms-token--drift',
  casing: 'sms-token--casing',
  mismatch: 'sms-token--mismatch',
  critical: 'sms-token--critical',
};

export function VerbatimTemplateBody({
  body,
  language,
  tokenMap,
  selectedFieldId,
  selectedToken,
  selectedLanguage,
  onTokenClick,
}: VerbatimTemplateBodyProps) {
  const segments = useMemo(() => tokenizeTemplateBody(body), [body]);
  const isArabic = language === 'Arabic';

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={isArabic ? 'ar' : 'en'}
      className={`text-[14.5px] leading-[1.85] text-slate-800 whitespace-pre-wrap break-words ${
        isArabic ? 'font-arabic text-right' : 'text-left'
      }`}
    >
      {segments.map((seg) => {
        if (seg.type === 'text') {
          return <span key={seg.index}>{seg.value}</span>;
        }

        const info = tokenMap[seg.value];
        const severity: TokenVisualSeverity = info?.severity ?? 'consistent';
        const fieldId = info?.fieldId;

        const isDirectSelected =
          selectedToken === seg.value &&
          (selectedLanguage === null || selectedLanguage === language);

        const isCounterpartSelected =
          !isDirectSelected &&
          selectedFieldId !== null &&
          fieldId === selectedFieldId;

        const severityClass = SEVERITY_CLASS[severity];
        const activeClass = isDirectSelected
          ? 'sms-token--active'
          : isCounterpartSelected
            ? 'sms-token--counterpart'
            : '';

        return (
          <button
            key={seg.index}
            type="button"
            dir="ltr"
            onClick={() => {
              if (fieldId) {
                onTokenClick(seg.value, fieldId, language);
              }
            }}
            aria-label={`Inspect token ${seg.value} (${info?.fieldLabel ?? 'Placeholder'}) in ${language}`}
            title={
              info
                ? `${info.fieldLabel}: ${info.explanation} (Click to inspect)`
                : seg.value
            }
            className={`sms-token ${severityClass} ${activeClass}`}
          >
            {seg.value}
          </button>
        );
      })}
    </div>
  );
}
