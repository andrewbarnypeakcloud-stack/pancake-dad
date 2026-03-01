# Audio Asset Manifest — Pancake Dad

All audio files must be provided in dual format (MP3 + OGG) for cross-browser compatibility.
Howler.js automatically selects the supported codec at runtime.

## Sound Effects (assets/audio/sfx/)

| File (without extension) | Description | Duration | Notes |
|--------------------------|-------------|----------|-------|
| flip-whoosh | Pancake flip whoosh | ~0.3s | Pitch varies with spin speed (0.8-1.3x rate) |
| sizzle-pop | Crisp landing sizzle | ~0.4s | Played on successful pancake catch |
| crowd-murmur | Ambient crowd murmur | ~2.0s | Audience stage: Watching |
| crowd-clap | Rhythmic applause | ~2.0s | Audience stage: Clapping |
| crowd-cheer | Enthusiastic cheering | ~2.0s | Audience stage: Excited |
| crowd-hysteria | Full stadium roar | ~2.5s | Audience stage: Hysteria |
| slipper-scuff | Soft scuff footstep | ~0.2s | Played during dad movement, pitch varies |
| sad-trombone | Comedic sad trombone | ~1.5s | Played on pancake drop |
| signature-sting | Signature trick sting | ~2.5s | Per-dad stings (future: separate files per dad) |
| combo-ding | Musical ding note | ~0.3s | Pitch rises with combo multiplier (semitone steps C-B) |
| combo-break | Record scratch / deflation | ~0.5s | Played on combo break |
| fire-ignite | Whoosh + sizzle | ~0.5s | Played on On Fire state activation |
| special-ready | Power-up chime | ~0.8s | Played when Special Meter reaches full |
| menu-click | Subtle click/pop | ~0.1s | UI menu interaction |
| purchase-ding | Cash register ding | ~0.4s | Shop purchase confirmation |
| unlock-fanfare | Short celebratory jingle | ~1.5s | Dad or item unlock |

### Format Requirements
- MP3: 128kbps CBR, 44.1kHz, mono (stereo for crowd sounds)
- OGG: q5 (~160kbps), 44.1kHz, same channel config as MP3
- Total SFX budget: < 500KB combined (both formats)

### Audio Sprite Candidates
These SFX are triggered frequently and should be bundled into a single audio sprite atlas for < 50ms latency:
- flip-whoosh
- sizzle-pop
- combo-ding
- slipper-scuff
- menu-click

## Music Tracks (assets/audio/music/)

| File (without extension) | Level | Style | Tempo | Loop |
|--------------------------|-------|-------|-------|------|
| menu-theme | Main Menu | Chill dad rock intro | Relaxed | Yes |
| level-apartment | The Apartment | Chill acoustic guitar | ~90 BPM | Yes |
| level-suburban | Suburban Home | Upbeat dad rock | ~120 BPM | Yes |
| level-openplan | Open Plan | Modern indie pop | ~130 BPM | Yes |
| level-holiday | Holiday Morning | Festive jingle rock | ~140 BPM | Yes |
| level-competition | The Competition | Epic game show theme | ~150 BPM | Yes |

### Format Requirements
- MP3: 192kbps CBR, 44.1kHz, stereo
- OGG: q6 (~192kbps), 44.1kHz, stereo
- Each track: 60-90 seconds before loop point
- Seamless loop: ensure start and end points match for gapless playback
- Total music budget: < 1MB per track (both formats combined)
- Music streams via HTML5 Audio (not Web Audio decode) to avoid full download before playback

## Per-Dad Signature Trick Stings (future)

These are 2-3 second musical stings that play during signature trick slow-motion:

| Dad | File | Sting Style |
|-----|------|-------------|
| Gary | gary-sting.mp3/.ogg | Classic rock riff |
| Tomasz | tomasz-sting.mp3/.ogg | Energetic synth flourish |
| Kenji | kenji-sting.mp3/.ogg | Precise piano arpeggio |
| Marcus | marcus-sting.mp3/.ogg | Dramatic brass fanfare |
| Pawel | pawel-sting.mp3/.ogg | Funky bass groove |

Note: Currently using a single signature-sting.mp3/.ogg placeholder.
Per-dad stings will be separate files once produced.

## Directory Structure

```
assets/audio/
  sfx/
    flip-whoosh.mp3
    flip-whoosh.ogg
    sizzle-pop.mp3
    sizzle-pop.ogg
    crowd-murmur.mp3
    crowd-murmur.ogg
    crowd-clap.mp3
    crowd-clap.ogg
    crowd-cheer.mp3
    crowd-cheer.ogg
    crowd-hysteria.mp3
    crowd-hysteria.ogg
    slipper-scuff.mp3
    slipper-scuff.ogg
    sad-trombone.mp3
    sad-trombone.ogg
    signature-sting.mp3
    signature-sting.ogg
    combo-ding.mp3
    combo-ding.ogg
    combo-break.mp3
    combo-break.ogg
    fire-ignite.mp3
    fire-ignite.ogg
    special-ready.mp3
    special-ready.ogg
    menu-click.mp3
    menu-click.ogg
    purchase-ding.mp3
    purchase-ding.ogg
    unlock-fanfare.mp3
    unlock-fanfare.ogg
  music/
    menu-theme.mp3
    menu-theme.ogg
    level-apartment.mp3
    level-apartment.ogg
    level-suburban.mp3
    level-suburban.ogg
    level-openplan.mp3
    level-openplan.ogg
    level-holiday.mp3
    level-holiday.ogg
    level-competition.mp3
    level-competition.ogg
```
