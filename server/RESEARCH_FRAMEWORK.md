# Research Framework: Neuro-Adaptive Multisensory Learning System

This document grounds the project in established neuroscience and learning-science theory. The system is framed as a **brain-informed adaptive learning platform** that uses **behavioral proxies** for cognitive and arousal states—we do not measure brain waves or direct neurological activity.

---

## 1. Project Positioning

| Current framing (technical) | Research-grade framing |
|-----------------------------|------------------------|
| A multimodal adaptive learning app with haptic + audio + visual + quiz adaptation | **A neuro-adaptive multisensory learning system designed to optimize memory encoding, cognitive load, and arousal state using multisensory stimulation.** |

The difference is **theoretical grounding**: each feature is justified by a specific theory and vocabulary.

---

## 2. Theory–Feature Mapping

| Brain principle | Theory (key source) | What it controls | Our feature |
|-----------------|---------------------|------------------|-------------|
| **Cognitive Load** | Cognitive Load Theory (Sweller, 1988) | Working memory capacity; preventing overload so encoding can occur | Quiz adaptation; behavioral prediction of load; difficulty/complexity regulation |
| **Dual Coding** | Dual Coding Theory (Paivio, 1971) | Visual + verbal channels; both activated without redundancy | Animation + narration; scene timing so visual supports verbal; synchronized modalities |
| **Embodied Cognition** | Lakoff & Johnson | Abstract concepts grounded in sensorimotor experience | Haptic mapping (e.g. gravity → downward pattern; electricity → pulses; waves → rhythm) |
| **Arousal optimization** | Yerkes–Dodson Law (1908) | Performance as inverted-U of arousal; optimal at moderate level | (Future) Stimulation intensity control: increase when bored, decrease when overloaded |
| **Neural strengthening** | Hebbian Learning (Hebb, 1949) | “Neurons that fire together wire together” | Synchronized visual, audio, and haptic events for key concepts |
| **Attention filtering** | Sensory gating | Brain filters repetitive stimuli; constant stimulation leads to habituation | (Design) Important concepts → multimodal burst; supporting content → visual/verbal only |

---

## 3. How to Explain to a Panel

### “Why haptic?”

> “Based on **embodied cognition theory**, abstract science concepts are better encoded when grounded in sensorimotor experience. We therefore map semantic properties of concepts to calibrated haptic patterns to support memory consolidation.”

### “Why adaptive stimulation / difficulty?”

> “We use **behavioral proxies for cognitive load** (e.g. response times, errors, answer changes) informed by **Cognitive Load Theory**. The system dynamically regulates intrinsic and extraneous load to reduce working memory saturation. In line with the **Yerkes–Dodson** arousal model, we can modulate sensory intensity to keep learners in an optimal arousal band.”

### “Why multiple modalities together?”

> “**Dual Coding** suggests combining visual and verbal channels improves encoding when they support rather than duplicate each other. **Hebbian learning** suggests that co-activating visual, auditory, and haptic channels for key moments strengthens the corresponding memory traces. We synchronize modalities for important concepts and avoid constant multimodal stimulation to respect **sensory gating**.”

### “Do you measure the brain?”

> “No. We use **behavioral proxies for cognitive load and engagement** (e.g. quiz performance, response latency, answer changes). We do not measure brain waves or direct neurological activity. This keeps the claim scientifically honest and defensible.”

---

## 4. Key Terminology to Use in Writing and Talks

- **Behavioral proxies for cognitive load** (not “we measure cognitive load”).
- **Working memory saturation** (Sweller): avoid overloading so encoding to long-term memory can occur.
- **Dual coding**: visual supports verbal; synchronize; avoid redundancy.
- **Embodied cognition**: abstract concepts grounded in body-based (e.g. haptic) experience.
- **Yerkes–Dodson / optimal arousal**: moderate arousal for best performance; modulate stimulation accordingly.
- **Hebbian learning**: synchronized multimodal presentation to strengthen traces.
- **Sensory gating**: selective use of multimodal bursts for important content to avoid habituation.

---

## 5. References (short)

- Hebb, D. O. (1949). *The Organization of Behavior*. Wiley.
- Paivio, A. (1971). *Imagery and Verbal Processes*. Holt, Rinehart & Winston.
- Sweller, J. (1988). Cognitive load during problem solving. *Cognitive Science*, 12(2), 257–285.
- Yerkes, R. M., & Dodson, J. D. (1908). The relation of strength of stimulus to rapidity of habit-formation. *Journal of Comparative Neurology and Psychology*, 18(5), 459–482.
- Lakoff, G., & Johnson, M. (1980). *Metaphors We Live By*. University of Chicago Press.

---

*This framework supports thesis-level positioning of the project as a **Neuro-Adaptive Multisensory Learning System** while remaining scientifically honest about the use of behavioral proxies.*
