import { useState } from 'react';
import { CheckCircle, Circle, Square, CheckSquare, Send, AlertCircle } from 'lucide-react';

interface FormQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multi' | 'yesno';
  choices?: string[];
}

interface FormData {
  id: string;
  title: string;
  questions: FormQuestion[];
}

function parseFormBlocks(content: string): FormData | null {
  const blockMatch = content.match(/---form\n([\s\S]*?)\n---/);
  if (!blockMatch) return null;

  const raw = blockMatch[1];
  const lines = raw.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;

  const questions: FormQuestion[] = [];
  let currentQ: Partial<FormQuestion> | null = null;
  let title = 'Formulaire';

  for (const line of lines) {
    const titleMatch = line.match(/^#\s*(.+)/);
    if (titleMatch) { title = titleMatch[1].trim(); continue; }

    const qMatch = line.match(/^(?:Q|Question)\s*(?:\d*\.?[\):]?)?\s*(.+)/i);
    if (qMatch) {
      if (currentQ && currentQ.question) questions.push(currentQ as FormQuestion);
      currentQ = { id: `q_${questions.length}`, question: qMatch[1].trim(), type: 'select', choices: [] };
      continue;
    }

    const textMatch = line.match(/^-\s*\[text\]\(?([^)]*)\)?\s*(.*)/);
    if (textMatch && currentQ) {
      currentQ.type = 'text';
      continue;
    }

    const yesnoMatch = line.match(/^-\s*\[yesno\]\s*(.*)/);
    if (yesnoMatch && currentQ) {
      currentQ.type = 'yesno';
      currentQ.choices = ['Oui', 'Non'];
      continue;
    }

    const choiceMatch = line.match(/^-\s*\[([ x])\]\s*(.+)/);
    if (choiceMatch && currentQ) {
      if (currentQ.type === 'select') currentQ.type = 'multi';
      currentQ.choices = currentQ.choices || [];
      currentQ.choices.push(choiceMatch[2].trim());
      continue;
    }

    const radioMatch = line.match(/^-\s*\(\s*([ x])\s*\)\s*(.+)/);
    if (radioMatch && currentQ) {
      currentQ.type = 'select';
      currentQ.choices = currentQ.choices || [];
      currentQ.choices.push(radioMatch[2].trim());
      continue;
    }

    const optMatch = line.match(/^-\s*(.+)/);
    if (optMatch && currentQ) {
      currentQ.type = 'select';
      currentQ.choices = currentQ.choices || [];
      currentQ.choices.push(optMatch[1].trim());
      continue;
    }
  }

  if (currentQ && currentQ.question) questions.push(currentQ as FormQuestion);
  if (questions.length === 0) return null;

  return { id: `form_${Date.now()}`, title, questions };
}

interface ChatFormProps {
  content: string;
  onSubmit: (answers: string) => void;
}

export function ChatForm({ content, onSubmit }: ChatFormProps) {
  const form = parseFormBlocks(content);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showError, setShowError] = useState(false);

  if (!form) return null;

  const handleSelect = (qId: string, choice: string) => {
    setAnswers(prev => ({ ...prev, [qId]: choice }));
    setShowError(false);
  };

  const handleMulti = (qId: string, choice: string) => {
    setAnswers(prev => {
      const current = (prev[qId] as string[]) || [];
      const next = current.includes(choice)
        ? current.filter(c => c !== choice)
        : [...current, choice];
      return { ...prev, [qId]: next };
    });
    setShowError(false);
  };

  const handleText = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    setShowError(false);
  };

  const handleYesNo = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    setShowError(false);
  };

  const handleSubmit = () => {
    const missing = form.questions.filter(q => {
      const val = answers[q.id];
      if (!val) return true;
      if (Array.isArray(val) && val.length === 0) return true;
      if (typeof val === 'string' && !val.trim()) return true;
      return false;
    });

    if (missing.length > 0) {
      setShowError(true);
      return;
    }

    setSubmitted(true);

    const formatted = form.questions.map(q => {
      const val = answers[q.id];
      const answerStr = Array.isArray(val) ? val.join(', ') : val;
      return `${q.question}\nRéponse: ${answerStr}`;
    }).join('\n\n');

    onSubmit(formatted);
  };

  if (submitted) {
    return (
      <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-bold">Formulaire soumis</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-3)] px-4 py-2.5">
        <p className="text-[11px] font-bold text-[var(--accent)]">{form.title}</p>
      </div>

      <div className="space-y-4 p-4">
        {form.questions.map((q, qi) => (
          <div key={q.id}>
            <p className="text-xs font-bold text-[var(--text)] mb-2.5 flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">
                {qi + 1}
              </span>
              {q.question}
            </p>

            {q.type === 'text' && (
              <textarea
                value={(answers[q.id] as string) || ''}
                onChange={e => handleText(q.id, e.target.value)}
                placeholder="Tape ta réponse ici..."
                rows={3}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-subtle)] outline-none transition focus:border-[var(--accent)] resize-none"
              />
            )}

            {q.type === 'yesno' && (
              <div className="flex gap-2">
                {q.choices?.map(c => (
                  <button
                    key={c}
                    onClick={() => handleYesNo(q.id, c)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      answers[q.id] === c
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:border-[var(--accent)]/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'select' && q.choices && (
              <div className="space-y-1.5">
                {q.choices.map(c => (
                  <button
                    key={c}
                    onClick={() => handleSelect(q.id, c)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition ${
                      answers[q.id] === c
                        ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]'
                        : 'border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:border-[var(--border-active)]/30'
                    }`}
                  >
                    <Circle className={`h-4 w-4 shrink-0 ${answers[q.id] === c ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'}`} />
                    {c}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'multi' && q.choices && (
              <div className="space-y-1.5">
                {q.choices.map(c => {
                  const selected = (answers[q.id] as string[]) || [];
                  const isChecked = selected.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => handleMulti(q.id, c)}
                      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition ${
                        isChecked
                          ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:border-[var(--border-active)]/30'
                      }`}
                    >
                      {isChecked
                        ? <CheckSquare className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                        : <Square className="h-4 w-4 shrink-0 text-[var(--text-subtle)]" />
                      }
                      {c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {showError && (
          <div className="flex items-center gap-1.5 text-red-400 text-[11px]">
            <AlertCircle className="h-3.5 w-3.5" />
            Réponds à toutes les questions avant de soumettre
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-xs font-bold text-white hover:opacity-85 transition"
        >
          <Send className="h-3.5 w-3.5" />
          Soumettre le formulaire
        </button>
      </div>
    </div>
  );
}

export function hasFormBlock(content: string): boolean {
  return /---form\n[\s\S]*?\n---/.test(content);
}
