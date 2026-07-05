/**
 * @fileoverview Tests for the metalsmith-cpc-class-pages plugin.
 *
 * The plugin turns offerings (attached to metadata by
 * metalsmith-cpc-classes) into virtual structured-content pages. These
 * tests exercise the pure formatting and section builders plus the
 * plugin's file generation, with no network and no build pipeline.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import cpcClassPages, {
  buildDetailsProse,
  buildGivebutterEmbedUrl,
  buildInstructorCtas,
  buildScheduleLine,
  buildSections,
  buildSessionItems,
  extractGivebutterSlug,
  formatTime,
  imageFolderSlug,
  resolveImagePath,
  resolveOfferingImages,
  slugify
} from '../plugins/metalsmith-cpc-class-pages.js';

const cpcData = {
  organization: 'Center for People and Craft',
  scholarshipUrl: 'https://example.com/scholarship',
  accessibility: { title: 'Accessibility', prose: 'Accessibility prose.' },
  cancellationPolicy: { title: 'Cancellation policy', prose: 'Cancellation prose.' }
};

const sampleOffering = {
  offeringId: 'staked-side-table-20260715',
  classTitle: 'Staked Side Table',
  category: 'Woodworking',
  shortSummary: 'Learn staked furniture.',
  fullDescription: 'A three session woodworking class.',
  whatToExpect: 'Hand tools throughout.',
  tuition: '225',
  materialsFee: '50',
  materialsFeeNote: 'Paid to instructor',
  minimumAge: '16',
  abilityLevel: 'Advanced beginner',
  instructorName: 'Jacob Mathioudis-Goudey',
  instructorBio: 'Woodworker in Minneapolis.',
  instructorLinks: 'instagram.com/@jake.mg.furniture',
  classImageUrl: 'https://example.com/table.jpg',
  instructorPhotoUrl: 'https://example.com/jacob.jpg',
  givebutterUrl: 'https://givebutter.com/example',
  firstSessionDate: '2026-07-15',
  sessions: [
    { sessionId: 's1', sessionDate: '2026-07-15', startTime: '18:00', endTime: '21:00', hostName: 'Pat' },
    { sessionId: 's2', sessionDate: '2026-07-22', startTime: '18:00', endTime: '21:00', hostName: '' },
    { sessionId: 's3', sessionDate: '2026-07-29', startTime: '18:00', endTime: '21:00', hostName: '' }
  ]
};

describe('formatTime', () => {
  it('converts 24h to 12h display', () => {
    assert.equal(formatTime('18:00'), '6:00 PM');
    assert.equal(formatTime('08:30'), '8:30 AM');
    assert.equal(formatTime('12:00'), '12:00 PM');
    assert.equal(formatTime('00:15'), '12:15 AM');
  });

  it('passes through unparseable values', () => {
    assert.equal(formatTime('whenever'), 'whenever');
  });
});

describe('buildScheduleLine', () => {
  it('formats a single session with full date', () => {
    const line = buildScheduleLine([
      { sessionDate: '2026-07-10', startTime: '13:00', endTime: '16:00' }
    ]);
    assert.equal(line, 'Friday, July 10, 2026: 1:00 PM - 4:00 PM');
  });

  it('groups same-weekday sessions like the live site', () => {
    const line = buildScheduleLine(sampleOffering.sessions);
    assert.equal(line, 'Wednesdays, July 15, 22, 29: 6:00 PM - 9:00 PM');
  });

  it('repeats the month when sessions cross a month boundary', () => {
    const line = buildScheduleLine([
      { sessionDate: '2026-07-29', startTime: '18:00', endTime: '21:00' },
      { sessionDate: '2026-08-05', startTime: '18:00', endTime: '21:00' }
    ]);
    assert.equal(line, 'Wednesdays, July 29, August 5: 6:00 PM - 9:00 PM');
  });

  it('lists short dates for mixed weekdays', () => {
    const line = buildScheduleLine([
      { sessionDate: '2026-07-08', startTime: '08:00', endTime: '09:00' },
      { sessionDate: '2026-07-28', startTime: '08:00', endTime: '09:00' }
    ]);
    assert.equal(line, 'Jul 8, Jul 28: 8:00 AM - 9:00 AM');
  });

  it('returns empty string for no sessions', () => {
    assert.equal(buildScheduleLine([]), '');
  });
});

describe('buildDetailsProse', () => {
  it('includes tuition, scholarship, materials, and age/ability', () => {
    const prose = buildDetailsProse(sampleOffering, cpcData);
    assert.match(prose, /\*\*Tuition: \$225\*\* per participant/);
    assert.match(prose, /Apply for a scholarship/);
    assert.match(prose, /\*\*Materials fee: \$50\*\* \(Paid to instructor\)/);
    assert.match(prose, /\*\*Age \/ Ability level:\*\* 16\+, Advanced beginner/);
  });

  it('omits a zero materials fee', () => {
    const prose = buildDetailsProse({ ...sampleOffering, materialsFee: '0' }, cpcData);
    assert.doesNotMatch(prose, /Materials fee/);
  });
});

describe('buildSessionItems', () => {
  it('builds display items with a hosted flag, never a name', () => {
    const items = buildSessionItems(sampleOffering.sessions);
    assert.equal(items.length, 3);
    assert.deepEqual(items[0], {
      sessionId: 's1',
      dateDisplay: 'Wednesday, July 15, 2026',
      timeDisplay: '6:00 PM - 9:00 PM',
      hosted: true
    });
    assert.equal(items[1].hosted, false);
    assert.ok(!JSON.stringify(items).includes('Pat'), 'host name leaked into page data');
  });
});

describe('buildSections', () => {
  it('builds the full page structure in order', () => {
    const sections = buildSections(sampleOffering, cpcData);
    assert.deepEqual(
      sections.map((section) => section.sectionType),
      [
        'hero',
        'rich-text',
        'rich-text',
        'givebutter-embed',
        'rich-text',
        'class-sessions',
        'rich-text',
        'rich-text',
        'columns'
      ]
    );
  });

  it('wires the sessions section with endpoint and session items', () => {
    const sections = buildSections(sampleOffering, cpcData, 'https://example.com/exec');
    const sessionsSection = sections.find((section) => section.sectionType === 'class-sessions');
    assert.equal(sessionsSection.endpoint, 'https://example.com/exec');
    assert.equal(sessionsSection.sessions.length, 3);
    assert.equal(sessionsSection.sessions[0].sessionId, 's1');
  });

  it('puts title, schedule, and an anchor register CTA in the hero', () => {
    const hero = buildSections(sampleOffering, cpcData)[0];
    assert.equal(hero.text.title, 'Staked Side Table');
    assert.equal(hero.text.subTitle, 'Wednesdays, July 15, 22, 29: 6:00 PM - 9:00 PM');
    assert.equal(hero.containerFields.background.image, 'https://example.com/table.jpg');
    assert.equal(hero.ctas[0].url, '#register', 'CTA scrolls to the embed when one exists');
  });

  it('builds the registration embed from the campaign URL', () => {
    const sections = buildSections(sampleOffering, cpcData);
    const embed = sections.find((section) => section.sectionType === 'givebutter-embed');
    assert.equal(embed.id, 'register');
    assert.equal(embed.embedUrl, 'https://givebutter.com/embed/c/example?goalBar=false');
  });

  it('skips optional sections when fields are empty', () => {
    const bare = {
      ...sampleOffering,
      fullDescription: '',
      whatToExpect: '',
      sessions: [],
      classImageUrl: '',
      givebutterUrl: ''
    };
    const sections = buildSections(bare, cpcData);
    assert.deepEqual(
      sections.map((section) => section.sectionType),
      ['hero', 'rich-text', 'rich-text', 'rich-text', 'columns']
    );
    assert.equal(sections[0].ctas.length, 0);
    assert.equal(sections[0].containerFields.background.imageScreen, 'none');
  });

  it('drops the photo column when there is no instructor photo', () => {
    const sections = buildSections({ ...sampleOffering, instructorPhotoUrl: '' }, cpcData);
    const instructor = sections[sections.length - 1];
    assert.equal(instructor.columns.length, 1);
    assert.equal(instructor.columns[0].blocks[0].text.subTitle, 'Jacob Mathioudis-Goudey');
  });

  it('renders instructor links as CTA buttons, not prose', () => {
    const sections = buildSections(sampleOffering, cpcData);
    const instructor = sections[sections.length - 1];
    const textColumn = instructor.columns[1];
    assert.equal(textColumn.blocks[0].text.prose, 'Woodworker in Minneapolis.');
    assert.deepEqual(textColumn.blocks[1].ctas, [
      {
        url: 'https://instagram.com/@jake.mg.furniture',
        label: 'Instagram',
        isButton: true,
        buttonStyle: 'primary'
      }
    ]);
  });

  it('omits the CTA block when there are no instructor links', () => {
    const sections = buildSections({ ...sampleOffering, instructorLinks: '' }, cpcData);
    const instructor = sections[sections.length - 1];
    assert.equal(instructor.columns[1].blocks.length, 1);
  });
});

describe('image resolution', () => {
  it('extracts the campaign slug from campaign and embed URLs', () => {
    assert.equal(extractGivebutterSlug('https://givebutter.com/summer-herbs'), 'summer-herbs');
    assert.equal(
      extractGivebutterSlug('https://givebutter.com/embed/c/summer-herbs?goalBar=false&gba_gb.element.id=gGRrMX'),
      'summer-herbs'
    );
    assert.equal(extractGivebutterSlug(''), '');
    assert.equal(extractGivebutterSlug('not a url'), '');
  });

  it('prefers the campaign slug for the image folder, falling back to the title slug', () => {
    assert.equal(imageFolderSlug(sampleOffering), 'example');
    assert.equal(
      imageFolderSlug({ ...sampleOffering, givebutterUrl: '' }),
      'staked-side-table'
    );
    assert.equal(slugify('Appliqué as Adornment'), 'applique-as-adornment');
  });

  it('resolves bare file names into the class image folder', () => {
    assert.equal(
      resolveImagePath('side-table.jpg', 'summer-herbs'),
      '/assets/images/classes/summer-herbs/side-table.jpg'
    );
    assert.equal(resolveImagePath('https://example.com/x.jpg', 'summer-herbs'), 'https://example.com/x.jpg');
    assert.equal(resolveImagePath('/assets/images/manual.jpg', 'summer-herbs'), '/assets/images/manual.jpg');
    assert.equal(resolveImagePath('', 'summer-herbs'), '');
  });

  it('keeps local images that exist and drops missing ones with a warning', () => {
    const offering = {
      ...sampleOffering,
      classImage: 'side-table.jpg',
      instructorPhoto: 'missing.jpg',
      classImageUrl: undefined,
      instructorPhotoUrl: undefined
    };
    const warnings = [];
    const resolved = resolveOfferingImages(
      offering,
      (sitePath) => sitePath.endsWith('side-table.jpg'),
      (message) => warnings.push(message)
    );
    assert.equal(resolved.classImageUrl, '/assets/images/classes/example/side-table.jpg');
    assert.equal(resolved.instructorPhotoUrl, '');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /missing\.jpg/);
  });

  it('passes remote URLs through without a file check', () => {
    const resolved = resolveOfferingImages(
      sampleOffering,
      () => {
        throw new Error('file check should not run for URLs');
      },
      () => {}
    );
    assert.equal(resolved.classImageUrl, 'https://example.com/table.jpg');
  });
});

describe('buildGivebutterEmbedUrl', () => {
  it('passes full embed URLs through untouched, preserving the element id', () => {
    const embedUrl = 'https://givebutter.com/embed/c/summer-herbs?goalBar=false&gba_gb.element.id=gGRrMX';
    assert.equal(buildGivebutterEmbedUrl(embedUrl), embedUrl);
  });

  it('converts a plain campaign URL to its embed form', () => {
    assert.equal(
      buildGivebutterEmbedUrl('https://givebutter.com/summer-herbs'),
      'https://givebutter.com/embed/c/summer-herbs?goalBar=false'
    );
  });

  it('returns empty string for empty or unusable input', () => {
    assert.equal(buildGivebutterEmbedUrl(''), '');
    assert.equal(buildGivebutterEmbedUrl(undefined), '');
    assert.equal(buildGivebutterEmbedUrl('not a url'), '');
    assert.equal(buildGivebutterEmbedUrl('https://givebutter.com/'), '');
  });
});

describe('buildInstructorCtas', () => {
  it('normalizes protocol and derives platform labels', () => {
    assert.deepEqual(buildInstructorCtas('instagram.com/@jake.mg.furniture'), [
      {
        url: 'https://instagram.com/@jake.mg.furniture',
        label: 'Instagram',
        isButton: true,
        buttonStyle: 'primary'
      }
    ]);
  });

  it('splits multiple links and labels generic ones by hostname', () => {
    const ctas = buildInstructorCtas('https://www.example.com/shop, facebook.com/someone');
    assert.equal(ctas.length, 2);
    assert.equal(ctas[0].label, 'example.com');
    assert.equal(ctas[1].label, 'Facebook');
  });

  it('returns an empty array for empty input', () => {
    assert.deepEqual(buildInstructorCtas(''), []);
    assert.deepEqual(buildInstructorCtas(undefined), []);
  });
});

describe('plugin behavior', () => {
  const createFakeMetalsmith = (metadata) => ({
    metadata: () => metadata,
    debug: () => () => {}
  });

  it('generates one file per offering', (_test, done) => {
    const files = {};
    const metadata = { classes: [sampleOffering], data: { cpc: cpcData } };
    const plugin = cpcClassPages({ fileExists: () => true });

    plugin(files, createFakeMetalsmith(metadata), (error) => {
      assert.equal(error, undefined);
      const file = files['classes/staked-side-table-20260715.md'];
      assert.ok(file, 'expected generated file');
      assert.equal(file.layout, 'pages/sections.njk');
      assert.equal(file.seo.title, 'Staked Side Table | Center for People and Craft');
      assert.equal(file.sections.length, 9);
      assert.deepEqual(file.card, {
        title: 'Staked Side Table',
        description: 'Learn staked furniture.',
        date: '2026-07-15T00:00:00',
        author: ['Jacob Mathioudis-Goudey'],
        thumbnail: 'https://example.com/table.jpg'
      });
      assert.ok(Buffer.isBuffer(file.contents));
      done();
    });
  });

  it('errors when offerings are missing from metadata', (_test, done) => {
    const plugin = cpcClassPages();
    plugin({}, createFakeMetalsmith({ data: { cpc: cpcData } }), (error) => {
      assert.match(error.message, /no offerings found/);
      done();
    });
  });

  it('errors when org config is missing', (_test, done) => {
    const plugin = cpcClassPages();
    plugin({}, createFakeMetalsmith({ classes: [] }), (error) => {
      assert.match(error.message, /org config missing/);
      done();
    });
  });
});
