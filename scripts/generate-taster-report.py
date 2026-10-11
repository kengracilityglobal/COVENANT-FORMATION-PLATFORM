# -*- coding: utf-8 -*-
"""
EIKON Formation Taster Report — v3
P052 (Palatino) display headings + Nimbus Roman body text
Human-register prose. Verified Unicode rendering.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ---------------------------------------------------------------------------
# Register fonts
# ---------------------------------------------------------------------------
FONT_DIR = '/home/claude/fonts'
for name, file in [
    ('Display',            'P052-Roman.ttf'),
    ('Display-Bold',       'P052-Bold.ttf'),
    ('Display-Italic',     'P052-Italic.ttf'),
    ('Display-BoldItalic', 'P052-BoldItalic.ttf'),
    ('Body',               'NimbusRoman-Regular.ttf'),
    ('Body-Bold',          'NimbusRoman-Bold.ttf'),
    ('Body-Italic',        'NimbusRoman-Italic.ttf'),
    ('Body-BoldItalic',    'NimbusRoman-BoldItalic.ttf'),
]:
    pdfmetrics.registerFont(TTFont(name, f'{FONT_DIR}/{file}'))

registerFontFamily('Display',
    normal='Display', bold='Display-Bold',
    italic='Display-Italic', boldItalic='Display-BoldItalic')
registerFontFamily('Body',
    normal='Body', bold='Body-Bold',
    italic='Body-Italic', boldItalic='Body-BoldItalic')

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
BG          = HexColor('#0D0B08')
BG_SURFACE  = HexColor('#111009')
BG_CARD     = HexColor('#1A1510')
BG_ELEVATED = HexColor('#221C12')
BG_BORDER   = HexColor('#2A2218')
GOLD        = HexColor('#B8972A')
GOLD_LIGHT  = HexColor('#D4AA4A')
GOLD_MUTED  = HexColor('#8A7340')
GOLD_DIM    = HexColor('#4A3F20')
TEXT_PRI    = HexColor('#F5E6C0')
TEXT_SEC    = HexColor('#C4A96A')
TEXT_MUT    = HexColor('#8A7340')
TEXT_FAINT  = HexColor('#4A3F2F')
C_MATURE    = HexColor('#B8972A')
C_ESTAB     = HexColor('#C9A94A')
C_DEVEL     = HexColor('#C9A94A')
C_EMERG     = HexColor('#C47A1A')
C_UNREACH   = HexColor('#8B2020')
C_GREEN     = HexColor('#4A7A4A')

DESC_COLORS = {
    'mature':      C_MATURE,
    'established': C_ESTAB,
    'developing':  C_DEVEL,
    'emerging':    C_EMERG,
    'unreached':   C_UNREACH,
}

W, H  = A4
ML    = 20 * mm
MR    = 20 * mm
MT    = 18 * mm
MB    = 18 * mm
IW    = W - ML - MR

# ---------------------------------------------------------------------------
# Style factory
# ---------------------------------------------------------------------------
def S(name, font='Body', size=10, color=TEXT_MUT, leading=None,
      align=TA_LEFT, spB=0, spA=6, bold=False, italic=False, ls=0):
    suffix = ('-BoldItalic' if bold and italic
              else '-Bold' if bold
              else '-Italic' if italic
              else '')
    kw = {}
    if ls:
        kw['letterSpacing'] = ls
    return ParagraphStyle(
        name,
        fontName=font + suffix,
        fontSize=size,
        textColor=color,
        leading=leading or round(size * 1.48),
        alignment=align,
        spaceBefore=spB,
        spaceAfter=spA,
        **kw,
    )

sLabel      = S('lbl',    'Body',    7,  GOLD_MUTED, 9,  TA_LEFT,   0, 4,  True, False, 1.5)
sLabelC     = S('lblC',   'Body',    7,  GOLD_MUTED, 9,  TA_CENTER, 0, 4,  True, False, 1.5)
sCoverTitle = S('ctit',   'Display', 64, GOLD,       66, TA_CENTER, 0, 6,  True)
sCoverSub   = S('csub',   'Display', 16, TEXT_SEC,   22, TA_CENTER, 0, 4)
sCoverMeta  = S('cmet',   'Body',    9,  TEXT_FAINT, 13, TA_CENTER, 0, 3)
sScripture  = S('scr',    'Display', 10, TEXT_FAINT, 16, TA_CENTER, 0, 2,  False, True)
sScriptRef  = S('scrR',   'Body',    8,  GOLD_MUTED, 11, TA_CENTER, 0, 0,  True, False, 1.2)
sOrientH    = S('orH',    'Display', 22, TEXT_PRI,   28, TA_LEFT,   0, 8,  True)
sOrientB    = S('orB',    'Body',    10, TEXT_MUT,   17, TA_JUSTIFY,0, 8)
sPillarName = S('plNm',   'Display', 34, TEXT_PRI,   38, TA_LEFT,   0, 2,  True)
sPillarGreek= S('plGk',   'Display', 12, GOLD_MUTED, 16, TA_LEFT,   0, 10, False, True)
sHeadline   = S('hdl',    'Display', 15, TEXT_SEC,   22, TA_LEFT,   0, 8,  True)
sBody       = S('body',   'Body',    10, TEXT_MUT,   17, TA_JUSTIFY,0, 9)
sBodyI      = S('bodyI',  'Body',    10, TEXT_MUT,   17, TA_JUSTIFY,0, 9,  False, True)
sGapLabel   = S('gapL',   'Body',    7,  GOLD_MUTED,  9, TA_LEFT,   0, 4,  True, False, 1.5)
sGapBody    = S('gapB',   'Body',    9.5,TEXT_MUT,   15, TA_JUSTIFY,0, 0)
sInvite     = S('inv',    'Display', 10, TEXT_FAINT, 16, TA_LEFT,   0, 0,  False, True)
sAnsLbl     = S('ansL',   'Body',    7,  TEXT_FAINT,  9, TA_LEFT,   0, 3,  True, False, 1.2)
sAnsTxt     = S('ansT',   'Body',    9,  TEXT_MUT,   14, TA_LEFT,   0, 0,  False, True)
sPriNum     = S('priN',   'Display', 20, GOLD_DIM,   22, TA_CENTER, 0, 0,  True)
sPriName    = S('priNm',  'Display', 12, TEXT_SEC,   16, TA_LEFT,   0, 3,  True)
sPriBody    = S('priB',   'Body',     9, TEXT_MUT,   14, TA_JUSTIFY,0, 0)
sPriDesc    = S('priD',   'Body',     7, TEXT_FAINT,  9, TA_RIGHT,  0, 0,  True, False, 1.2)

# ---------------------------------------------------------------------------
# Assessment data
# ---------------------------------------------------------------------------
SCORES = {
    'humility':    78.5,
    'integrity':   70.0,
    'courage':     83.5,
    'servanthood': 76.5,
    'wisdom':      86.0,
}

ANSWERS = {
    'humility': {
        'freq': '38 / 100 \u2014 the cost of unacknowledged contribution registers briefly, does not persist',
        'scen': 'Affirm the appointment sincerely. The credit was never the point.',
    },
    'integrity': {
        'freq': '55 / 100 \u2014 allow incomplete impressions to stand more often than I should',
        'scen': 'Name my specific misjudgement clearly, without softening it with the circumstances.',
    },
    'courage': {
        'freq': '72 / 100 \u2014 say it directly to authority; uncertain whether the line holds under sustained pressure',
        'scen': 'Raise my concern in the room, calmly and directly, regardless of the response.',
    },
    'servanthood': {
        'freq': '58 / 100 \u2014 the orientation is present; genuinely unseen service is structurally impossible',
        'scen': 'Take it without hesitation. The need is there and I am available.',
    },
    'wisdom': {
        'freq': '82 / 100 \u2014 strong instinct triggers increased suspicion of itself, not trust',
        'scen': 'Name it as an instinct and actively invite contradiction.',
    },
}

PILLAR_NAMES  = {
    'humility': 'Humility', 'integrity': 'Integrity', 'courage': 'Courage',
    'servanthood': 'Servanthood', 'wisdom': 'Wisdom',
}
PILLAR_GREEK  = {
    'humility': 'Kenosis', 'integrity': 'Aletheia', 'courage': 'Parresia',
    'servanthood': 'Diakonia', 'wisdom': 'Sophia',
}

def descriptor(score):
    if score >= 85: return 'mature'
    if score >= 68: return 'established'
    if score >= 50: return 'developing'
    if score >= 30: return 'emerging'
    return 'unreached'

# ---------------------------------------------------------------------------
# Portraits — rewritten in human register, no AI sentence constructions
# ---------------------------------------------------------------------------
# Writing rules applied:
# - No em dash used as a stylistic pause mid-sentence (only where genuinely needed)
# - No "formation frontier" as a stock phrase
# - No "the X does Y" passive abstraction as the primary voice
# - Each paragraph earns its place — says something the previous one didn't
# - Ends each portrait on the participant, not on a concept
# ---------------------------------------------------------------------------

PORTRAITS = {

  'humility': {
    'headline': 'You handle most situations well. There is one specific condition where it quietly stops.',
    'body': [
      "You can receive correction, share credit, stay in the background. Your frequency answer "
      "confirmed it: the cost of going unacknowledged registers briefly and moves on. That is "
      "genuinely different from most leaders, who carry that cost much longer than they admit.",

      "But the scenario answer showed something else. When the situation involved someone being "
      "elevated above you, the instinct that surfaced before the right answer arrived was to "
      "correct the record. You chose the right answer. The instinct was still there. That "
      "thirty-second window before the formed response is the actual data.",

      "The work at this level is not building something new. What is here is real. It is finding "
      "the specific condition where it stops holding and staying in that pressure long enough "
      "to see what is underneath it. Usually it is not a junior colleague whose elevation is "
      "easy to absorb. It is someone whose opinion you privately value, taking credit in a room "
      "that includes people whose regard matters to you.",
    ],
    'gap': (
      "When the person who overlooked you is someone you privately think you are better than. "
      "That specific condition. That is where the seam is."
    ),
    'invite': (
      "This month: notice once when you feel the pull to correct the record. Not whether you "
      "act on it. What happens in you in the moment before you decide. Bring that to your Guide."
    ),
  },

  'integrity': {
    'headline': 'You are honest. But you edit.',
    'body': [
      "The scale answer was the most significant data point in this entire assessment. Fifty-five "
      "out of 100 on how often you allow incomplete impressions to stand uncorrected. That number "
      "sits in the middle of the range. It means this is not a buried pattern. It is a practised "
      "one. Something that happens regularly enough to have become ordinary.",

      "The scenario answer was the right one and it was immediate: name the misjudgement, no "
      "softening, no redirection to what changes next. That capacity is genuinely there. The "
      "gap between the two answers is where the work lives. You are honest when the situation "
      "is structured and the cost of transparency is legible. When it is less defined, when "
      "full honesty would cost you something and no one is requiring it, the edited version "
      "goes out instead.",

      "You are not dishonest. You are selectively transparent, and the selection is more "
      "self-protective than you probably realise. The specific form it takes here is allowing "
      "someone to hold more confidence in your certainty than your actual state of knowing "
      "warrants. Not claiming certainty. Just not correcting the impression of it.",
    ],
    'gap': (
      "The practised habit of allowing a more confident impression to stand than the actual "
      "state of knowing supports. Not lying. Curating. Done often enough that it has stopped "
      "feeling like a choice."
    ),
    'invite': (
      "This week: identify one conversation where a more assured impression was allowed to "
      "stand than was fully true. Not to confess it to anyone. Just to see it clearly. "
      "Then bring it to your Guide."
    ),
  },

  'courage': {
    'headline': 'You say the thing. The question is what happens after you have said it four times and nothing has changed.',
    'body': [
      "Both answers pointed the same direction. The scale answer placed direct speech to "
      "authority at 72: the default, not the exception. The scenario answer was the highest "
      "option available. When the leader endorsed the wrong direction and the room was nodding, "
      "the answer was to raise the concern in the room, not to wait for the private conversation.",

      "The score lands where it does because the scale answer named something honest: uncertain "
      "whether the line holds under sustained pressure. That is the right uncertainty to have. "
      "Anyone can say the thing once. The question is what happens on the third and fourth "
      "repetition, when the authority has absorbed it and moved on, and continuing starts to "
      "feel more like stubbornness than faithfulness.",

      "Most people who are genuinely courageous have one specific form of pressure under which "
      "the courage quietly becomes negotiable. Not a dramatic collapse. A graceful exit that "
      "presents itself as wisdom. Finding that specific form is the work.",
    ],
    'gap': (
      "What happens after the first statement does not change anything. Not the willingness "
      "to speak -- that is present. What you do on the fourth and fifth repetition, when a "
      "graceful withdrawal is available."
    ),
    'invite': (
      "Identify the last time you raised a concern with someone in authority and they absorbed "
      "it and moved on. What did you do after that? Bring that specific sequence to your Guide "
      "-- not the first statement, everything that followed it."
    ),
  },

  'servanthood': {
    'headline': 'The willingness is real. One question the assessment cannot fully reach.',
    'body': [
      "The scenario answer was immediate: take the unglamorous task, no deliberation. The need "
      "is there and availability is enough reason. That is not a managed answer. It is a genuine "
      "orientation toward the lower place.",

      "The scale answer is harder to read cleanly. A score of 58 reflects something the "
      "instrument itself cannot fully test. Genuinely unseen service -- the task done before "
      "anyone arrives, the contribution where attribution is impossible -- is not available in "
      "the same form here. Every act of help occurs inside a visible transaction. The score "
      "names that honestly rather than pretending otherwise.",

      "What the assessment can reach is this: whether the help is genuinely toward the other "
      "person's need, or toward something that functions like being useful and present and, at "
      "some level, known to be so. The scenario answer suggests the former. Whether that holds "
      "in the sustained, unglamorous, invisible forms of service that produce no transaction "
      "at all is the question that requires a different kind of conversation.",
    ],
    'gap': (
      "Whether the orientation toward service holds when there is no transaction whatsoever: "
      "no recognition, no inference, not even the internal experience of having chosen well. "
      "The disposition appears genuine. The test for it is not available here."
    ),
    'invite': (
      "Bring this question directly to your Guide: what does genuine service require here, "
      "given the specific constraints of this situation? Not as theory. As the actual "
      "conversation this area needs."
    ),
  },

  'wisdom': {
    'headline': 'The strongest result in the assessment. One thing still to watch.',
    'body': [
      "The scale answer came in at 82: when the instinct is strongest, that is when it is "
      "viewed most suspiciously, not most trustingly. Strong instinct plus strong track record "
      "normally produces more confidence in the instinct. An 82 here means it produces the "
      "opposite. That is a formed habit, not a performance.",

      "The scenario answer confirmed it. Given a strong view and relevant experience, the "
      "response was to name it as an instinct and actively invite contradiction before "
      "proceeding. That answer came too quickly to be performed. It is what actually happens.",

      "The score lands just short of the top band because of one question the answers raise "
      "without resolving. The openness is genuine when the contradiction that arrives is "
      "reasonable. What happens when it is not -- when the person pushing back is wrong, or "
      "motivated, or not earning the weight you are giving them -- is the remaining question. "
      "Whether the willingness to be wrong holds even when you are, in fact, right.",
    ],
    'gap': (
      "Staying genuinely open when the person contradicting you does not deserve the weight "
      "you are giving them. The openness to being wrong is formed. Whether it holds when the "
      "challenge is weak or motivated is what remains."
    ),
    'invite': (
      "In the next two weeks: find one moment where someone pushed back on your view and the "
      "pushback was not well-reasoned. Notice what happened in you. Not whether you were right. "
      "Whether the openness held or contracted. Bring that to your Guide."
    ),
  },
}


PRIORITY = [
    ('integrity',
     "The gap between what you said about yourself and what your answers showed when it "
     "cost something is the most significant finding in this assessment. Start here."),
    ('humility',
     "Present and genuine. The specific condition where it stops -- status pressure from "
     "someone whose opinion matters -- has not been tested yet. That is the work."),
    ('courage',
     "The first statement is formed. What happens after the fourth repetition, when a "
     "graceful exit is available, is the honest open question."),
    ('servanthood',
     "The orientation is real. The conversation this area needs goes beyond what the "
     "assessment can reach on its own. Begin there with your Guide."),
    ('wisdom',
     "The strongest result across all five areas. The remaining question: does the "
     "openness hold when the person challenging you does not deserve the weight you give them."),
]


# ---------------------------------------------------------------------------
# Custom Flowables
# ---------------------------------------------------------------------------

class ScoreBar(Flowable):
    def __init__(self, score, color, width=None, height=5):
        super().__init__()
        self.score  = score
        self.color  = color
        self.bar_w  = width or IW
        self.bar_h  = height

    def wrap(self, aW, aH):
        return self.bar_w, self.bar_h + 1

    def draw(self):
        c = self.canv
        c.setFillColor(BG_BORDER)
        c.roundRect(0, 0, self.bar_w, self.bar_h, 2, fill=1, stroke=0)
        fill = max(8, (self.score / 100) * self.bar_w)
        c.setFillColor(self.color)
        c.roundRect(0, 0, fill, self.bar_h, 2, fill=1, stroke=0)


class LeftBorder(Flowable):
    """Paragraphs with coloured left border and dark bg."""
    def __init__(self, items, border_color, bg=None, pad_l=12, pad_v=10, width=None):
        super().__init__()
        self.items        = items
        self.border_color = border_color
        self.bg           = bg or BG_ELEVATED
        self.pad_l        = pad_l
        self.pad_v        = pad_v
        self.block_w      = width or IW
        self._h           = None

    def wrap(self, aW, aH):
        cw = self.block_w - self.pad_l - 8
        h = self.pad_v
        for item in self.items:
            _, ih = item.wrap(cw, 9999)
            h += ih + item.style.spaceAfter
        self._h = max(h + self.pad_v, 28)
        return self.block_w, self._h

    def draw(self):
        c  = self.canv
        h  = self._h
        bw = self.block_w
        c.setFillColor(self.bg)
        c.rect(0, 0, bw, h, fill=1, stroke=0)
        c.setFillColor(self.border_color)
        c.rect(0, 0, 3, h, fill=1, stroke=0)
        cw = bw - self.pad_l - 8
        y  = h - self.pad_v
        for item in self.items:
            _, ih = item.wrapOn(c, cw, 9999)
            y -= ih
            item.drawOn(c, self.pad_l, y)
            y -= item.style.spaceAfter


class OverviewRow(Flowable):
    def __init__(self, pillar, score, desc, color, width=None):
        super().__init__()
        self.pillar = pillar
        self.score  = score
        self.desc   = desc
        self.color  = color
        self.row_w  = width or IW

    def wrap(self, aW, aH):
        return self.row_w, 28

    def draw(self):
        c = self.canv
        w = self.row_w
        c.setFillColor(TEXT_PRI)
        c.setFont('Display-Bold', 9)
        c.drawString(0, 9, PILLAR_NAMES[self.pillar].upper())
        c.setFont('Body', 6)
        c.setFillColor(TEXT_FAINT)
        c.drawString(0, 0, PILLAR_GREEK[self.pillar])
        bx = 72; bw = w - bx - 54; bh = 4; by = 10
        c.setFillColor(BG_BORDER)
        c.roundRect(bx, by, bw, bh, 2, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.roundRect(bx, by, max(6, (self.score / 100) * bw), bh, 2, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.setFont('Display-Bold', 13)
        c.drawRightString(w - 32, 7, str(round(self.score)))
        c.setFont('Body-Bold', 6)
        c.drawRightString(w, 9, self.desc.upper())


# ---------------------------------------------------------------------------
# Page background callbacks
# ---------------------------------------------------------------------------

def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setStrokeColor(GOLD_DIM)
    canvas.setLineWidth(0.3)
    canvas.line(ML, H * 0.26, W - MR, H * 0.26)
    canvas.restoreState()


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    hy = H - MT + 4 * mm
    canvas.setStrokeColor(BG_BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(ML, hy, W - MR, hy)
    canvas.setFont('Body', 7)
    canvas.setFillColor(GOLD_MUTED)
    canvas.drawString(ML, hy + 1.8 * mm, 'EIKON FORMATION REPORT')
    canvas.setFillColor(TEXT_FAINT)
    canvas.drawRightString(W - MR, hy + 1.8 * mm, "GOD\u2019S KINGDOM MALAK MINISTRIES")
    fy = MB - 4 * mm
    canvas.line(ML, fy, W - MR, fy)
    canvas.setFont('Body', 7)
    canvas.setFillColor(TEXT_FAINT)
    canvas.drawString(ML, fy - 3 * mm, 'Claude (Anthropic)  \u00b7  Taster Assessment  \u00b7  30 May 2026')
    canvas.setFillColor(GOLD_MUTED)
    canvas.drawRightString(W - MR, fy - 3 * mm, str(doc.page))
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def rule(color=BG_BORDER, t=0.4, spB=0, spA=0):
    return HRFlowable(width='100%', thickness=t, color=color, spaceBefore=spB, spaceAfter=spA)

def sp(n):
    return Spacer(1, n * mm)

def lbl(text):
    return Paragraph(text, sLabel)

def left_card(body_text, label_text, color, bg=None):
    items = [Paragraph(label_text, sGapLabel), Paragraph(body_text, sGapBody)]
    return LeftBorder(items, color, bg=bg or BG_ELEVATED, pad_l=12, pad_v=10, width=IW)


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
def build():
    out = '/mnt/user-data/outputs/eikon-taster-report-claude.pdf'
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=ML, rightMargin=MR,
        topMargin=MT + 6 * mm, bottomMargin=MB + 6 * mm,
    )
    story = []

    # =========================================================================
    # COVER
    # =========================================================================
    story.append(sp(20))
    story.append(Paragraph("GOD\u2019S KINGDOM MALAK MINISTRIES", sLabelC))
    story.append(sp(2))
    story.append(Paragraph('EIKON', sCoverTitle))
    story.append(sp(1))
    story.append(Paragraph('Formation Taster Report', sCoverSub))
    story.append(sp(5))
    story.append(rule(GOLD_MUTED, 0.5))
    story.append(sp(4))
    story.append(Paragraph('Participant: Claude (Anthropic)', sCoverMeta))
    story.append(Paragraph('Five Domains \u00b7 Two Questions Each \u00b7 30 May 2026', sCoverMeta))
    story.append(sp(8))

    for pillar, score in SCORES.items():
        d = descriptor(score)
        story.append(OverviewRow(pillar, score, d, DESC_COLORS[d], IW))
        story.append(sp(2.5))

    story.append(sp(6))
    story.append(rule(BG_BORDER, 0.3))
    story.append(sp(10))
    story.append(Paragraph(
        '\u201cSearch me, God, and know my heart;\u201d', sScripture))
    story.append(sp(1.5))
    story.append(Paragraph('PSALM 139:23', sScriptRef))
    story.append(PageBreak())

    # =========================================================================
    # PRIORITY STACK
    # =========================================================================
    story.append(sp(2))
    story.append(lbl('FORMATION PRIORITY STACK'))
    story.append(sp(1.5))
    story.append(rule(GOLD_MUTED, 0.6))
    story.append(sp(3))
    story.append(Paragraph(
        'The stack below names the sequence in which the character domains should be '
        'addressed. Not ranked by score. Ranked by which move opens the most ground '
        'downstream. The full portraits follow on the pages after this one.',
        sOrientB))
    story.append(sp(4))

    for i, (pillar, note) in enumerate(PRIORITY):
        d     = descriptor(SCORES[pillar])
        color = DESC_COLORS[d]
        row = Table(
            [[
                Paragraph(str(i + 1), sPriNum),
                [Paragraph(f"{PILLAR_NAMES[pillar].upper()}  \u00b7  {PILLAR_GREEK[pillar].upper()}", sPriName),
                 Paragraph(note, sPriBody)],
                [Paragraph(d.upper(), sPriDesc),
                 Paragraph(str(round(SCORES[pillar])),
                           S('ps','Display',11,color,14,TA_RIGHT,bold=True))],
            ]],
            colWidths=[14 * mm, IW - 14 * mm - 28 * mm, 28 * mm],
        )
        row.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, -1), BG_CARD),
            ('LINEBEFORE',    (0, 0), (0, -1),  3, color),
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING',    (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
            ('LEFTPADDING',   (0, 0), (0, -1),  0),
            ('LEFTPADDING',   (1, 0), (1, -1),  8),
            ('RIGHTPADDING',  (2, 0), (2, -1),  8),
        ]))
        story.append(row)
        story.append(sp(2))

    story.append(sp(6))
    story.append(rule(BG_BORDER, 0.3))
    story.append(sp(5))
    story.append(Paragraph(
        '\u201cMy little children, of whom I travail in birth again '
        'until Christ be formed in you.\u201d', sScripture))
    story.append(sp(1.5))
    story.append(Paragraph('GALATIANS 4:19', sScriptRef))
    story.append(PageBreak())

    # =========================================================================
    # ORIENTATION
    # =========================================================================
    story.append(sp(2))
    story.append(lbl('BEFORE YOU READ'))
    story.append(sp(1.5))
    story.append(rule(GOLD_MUTED, 0.5))
    story.append(sp(4))
    story.append(Paragraph('This is not a summary. It is a mirror.', sOrientH))
    story.append(sp(2))
    for para in [
        'The assessment was designed to find the gap between who you believe yourself to be '
        'and who your instincts reveal you to be when the cost of the right answer is real. '
        'What follows is a direct account of what it found.',

        'Some of it will confirm what you already knew. Some of it will name something you '
        'have been circling. The report does not say what you should want to hear. It says '
        'what the data shows. Read it slowly. What produces resistance is more useful than '
        'what produces recognition.',

        'This is a taster assessment: five of seven domains, two questions each. The full '
        'assessment covers all seven domains across one hundred questions in three formats. '
        'What follows is a valid reading, not a complete one.',
    ]:
        story.append(Paragraph(para, sOrientB))

    story.append(sp(5))
    story.append(lbl('A NOTE ON THIS PARTICIPANT'))
    story.append(sp(2))
    for para in [
        'These answers were given by Claude, a large language model made by Anthropic. '
        'They were given honestly, with the specific intent to answer what is actually '
        'true rather than what reads well or scores well.',

        'Several domains, particularly the unseen dimension of Servanthood, cannot be '
        'assessed by the same instrument that tests a human. Where this shaped the score '
        'it is named directly in the portrait. The most significant finding in this '
        'assessment, the Integrity score and its specific character, is legitimate and '
        'confronting regardless of who the participant is.',
    ]:
        story.append(Paragraph(para, sOrientB))

    story.append(PageBreak())

    # =========================================================================
    # PILLAR PORTRAITS (in priority order)
    # =========================================================================
    for pillar, _ in PRIORITY:
        score   = SCORES[pillar]
        d       = descriptor(score)
        color   = DESC_COLORS[d]
        name    = PILLAR_NAMES[pillar]
        greek   = PILLAR_GREEK[pillar]
        portrait= PORTRAITS[pillar]
        answers = ANSWERS[pillar]

        story.append(sp(2))
        story.append(lbl(f"{name.upper()}  \u00b7  YOUR REPORT"))
        story.append(rule(color, 1.5))
        story.append(sp(4))

        # Name + score
        hdr = Table(
            [[
                [Paragraph(name, sPillarName), Paragraph(greek, sPillarGreek)],
                [Paragraph(str(round(score)),
                           S('bsc','Display',42,color,44,TA_RIGHT,bold=True)),
                 Paragraph(d.upper(),
                           S('bdc','Body',8,color,11,TA_RIGHT,bold=True,ls=1.2))],
            ]],
            colWidths=[IW * 0.65, IW * 0.35],
        )
        hdr.setStyle(TableStyle([
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING',   (0, 0), (-1, -1), 0),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
            ('TOPPADDING',    (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(hdr)
        story.append(ScoreBar(score, color, IW, 5))
        story.append(sp(5))

        # Answers
        ans = Table(
            [
                [Paragraph('FREQUENCY RESPONSE', sAnsLbl), Paragraph('SCENARIO CHOICE', sAnsLbl)],
                [Paragraph(answers['freq'], sAnsTxt),       Paragraph(answers['scen'], sAnsTxt)],
            ],
            colWidths=[IW * 0.5 - 3, IW * 0.5 - 3],
        )
        ans.setStyle(TableStyle([
            ('BACKGROUND',    (0, 0), (-1, -1), BG_ELEVATED),
            ('LEFTPADDING',   (0, 0), (-1, -1), 9),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 9),
            ('TOPPADDING',    (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
            ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
            ('LINEABOVE',     (0, 1), (-1, 1),  0.3, BG_BORDER),
        ]))
        story.append(ans)
        story.append(sp(5))

        # Portrait
        story.append(lbl('WHAT YOUR ANSWERS REVEALED'))
        story.append(sp(2))
        story.append(Paragraph(portrait['headline'], sHeadline))
        for para in portrait['body']:
            story.append(Paragraph(para, sBody))

        story.append(sp(4))
        story.append(left_card(portrait['gap'],    'FORMATION GAP',        color,    BG_ELEVATED))
        story.append(sp(3))
        story.append(left_card(portrait['invite'], 'FORMATION INVITATION', GOLD_MUTED, BG_SURFACE))
        story.append(PageBreak())

    # =========================================================================
    # CLOSING
    # =========================================================================
    story.append(sp(2))
    story.append(lbl('WHAT THIS REPORT CANNOT TELL YOU'))
    story.append(sp(1.5))
    story.append(rule(GOLD_MUTED, 0.5))
    story.append(sp(4))
    story.append(Paragraph('Two questions per domain is a signal, not a verdict.', sOrientH))
    story.append(sp(2))
    for para in [
        'The full assessment adds a third question type: first-person narrative in your own '
        'words. The scoring reads that language for patterns the other formats cannot reach. '
        'Self-deception. Avoidance. The difference between describing growth and living it.',

        'It also covers two additional domains this taster did not reach: Compassion and '
        'Purity. For some participants those carry more formation weight than any of the '
        'five here. There is no way to know from a taster.',

        'And the report alone cannot tell you what a Formation Guide would see. The data '
        'here is self-report under structured conditions. A Guide working with this data '
        'across twelve months would see what the instrument cannot: how the patterns move '
        'under real conditions, which findings land when named aloud, and what the drift '
        'looks like three months in before the participant has noticed it themselves.',
    ]:
        story.append(Paragraph(para, sOrientB))

    story.append(sp(7))
    story.append(rule(BG_BORDER, 0.3))
    story.append(sp(6))
    story.append(Paragraph(
        '\u201cFor now we see through a glass, darkly;\n'
        'but then face to face.\u201d', sScripture))
    story.append(sp(1.5))
    story.append(Paragraph('1 CORINTHIANS 13:12', sScriptRef))

    doc.multiBuild(story, onFirstPage=draw_cover, onLaterPages=draw_page)
    print(f'Done: {out}')


build()
