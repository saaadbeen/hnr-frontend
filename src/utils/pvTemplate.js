import dayjs from 'dayjs';

export const PV_TEMPLATES = {
  DEMOLITION: {
    title: 'PROCÈS-VERBAL DE DÉMOLITION',
    sections: ['header', 'context', 'constatations', 'decision', 'photos', 'signatures'],
    requiresPhotos: true,
    requiresAmende: false
  },
  SIGNALEMENT: {
    title: 'PROCÈS-VERBAL DE SIGNALEMENT',
    sections: ['header', 'context', 'constatations', 'decision', 'photos', 'signatures'],
    requiresPhotos: false,
    requiresAmende: false
  },
  NON_DEMOLITION: {
    title: 'PROCÈS-VERBAL DE NON-DÉMOLITION',
    sections: ['header', 'context', 'constatations', 'justification', 'photos', 'signatures'],
    requiresPhotos: false,
    requiresAmende: false
  }
};

export class PVTemplate {
  constructor(actionType) {
    this.actionType = actionType;
    this.config = PV_TEMPLATES[actionType] || PV_TEMPLATES.SIGNALEMENT;
    this.data = {};
    this.photos = [];
    this.customFields = {};
  }

  setData(data) {
    this.data = {
      numerosPV: data.numeroPV || this.generatePVNumber(),
      date: data.date || new Date(),
      agent: data.agent || {},
      mission: data.mission || {},
      action: data.action || {},
      commune: data.commune || '',
      prefecture: data.prefecture || '',
      adresse: data.adresse || '',
      coordinates: data.coordinates || null,
      observations: data.observations || '',
      constatations: data.constatations || '',
      decision: data.decision || '',
      justification: data.justification || '',
      createdAt: new Date(),
      ...data
    };
    return this;
  }

  setPhotos(photos) {
    this.photos = (photos || []).map(photo => ({
      id: photo.id,
      url: photo.url || photo.tempUrl,
      category: photo.category || 'general',
      name: photo.name || photo.originalName || 'Photo',
      description: photo.description || '',
      timestamp: photo.metadata?.uploadTime || new Date().toISOString(),
      size: photo.size,
      type: photo.type
    }));
    return this;
  }

  addCustomField(key, value, section = 'custom') {
    if (!this.customFields[section]) this.customFields[section] = {};
    this.customFields[section][key] = value;
    return this;
  }

  generatePVNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `PV${year}${this.actionType?.substring(0, 3) || 'SIG'}${timestamp}`;
  }

  generateHeader() {
    return `
╔════════════════════════════════════════════════════════════════╗
║                        ROYAUME DU MAROC                        ║
║                    MINISTÈRE DE L'INTÉRIEUR                    ║
║                  PRÉFECTURE DE ${(this.data.prefecture || 'CASABLANCA').toUpperCase().padEnd(18)} ║
╚════════════════════════════════════════════════════════════════╝

                        ${this.config.title}
                           N° ${this.data.numerosPV}

Date: ${dayjs(this.data.date).format('DD/MM/YYYY à HH:mm')}
Lieu: ${this.data.commune}, ${this.data.prefecture}
${this.data.adresse ? `Adresse: ${this.data.adresse}` : ''}
${this.data.coordinates ? `Coordonnées GPS: ${this.formatCoordinates(this.data.coordinates)}` : ''}

══════════════════════════════════════════════════════════════════
`;
  }

  generateContext() {
    return `
I. CONTEXTE DE L'INTERVENTION

L'an ${new Date().getFullYear()}, le ${dayjs(this.data.date).format('DD MMMM YYYY')}, à ${dayjs(this.data.date).format('HH[h]mm')},

Nous soussigné ${this.data.agent.nom || 'Agent d\'autorité'}, 
${this.data.agent.grade || 'Agent d\'autorité'} dûment assermenté,
agissant dans le cadre de nos fonctions et en vertu des pouvoirs qui nous sont conférés,

Dans le cadre de la mission : "${this.data.mission.titre || 'Mission de contrôle'}"
Référence mission : ${this.data.mission.id || 'N/A'}
${this.data.mission.description ? `Description : ${this.data.mission.description}` : ''}

Avons procédé à une intervention sur le terrain au lieu susmentionné.

`;
  }

  generateConstatations() {
    const hasGeom = !!this.data.action?.geometry;
    const coordsLine = hasGeom ? `
Localisation précise de l'intervention :
- Coordonnées : ${this.formatCoordinates([
  this.data.action.geometry.coordinates[1],
  this.data.action.geometry.coordinates[0]
])}
- Source : ${this.data.action.geoMetadata?.source === 'gps' ? 'GPS' : 'Carte'}
${this.data.action.geoMetadata?.accuracy ? `- Précision : ±${this.data.action.geoMetadata.accuracy}m` : ''}` : '';

    return `
II. CONSTATATIONS

Au cours de notre intervention, nous avons pu constater les éléments suivants :

${this.data.constatations || this.data.observations || 'Constatations à compléter'}
${hasGeom ? `\n${coordsLine}\n` : ''}

État des lieux au moment de l'intervention :
- Date de l'action : ${dayjs(this.data.action?.dateAction || this.data.date).format('DD/MM/YYYY')}
- Type d'intervention : ${this.getActionTypeLabel()}
- Conditions météorologiques : ${this.customFields.meteo?.conditions || 'Normales'}

`;
  }

  generateDecision() {
    const decisions = {
      DEMOLITION: 'Démolition immédiate de la construction non autorisée',
      SIGNALEMENT: 'Signalement aux autorités compétentes pour suivi',
      NON_DEMOLITION: 'Report de démolition avec justification'
    };

    return `
III. DÉCISION ET MESURES PRISES

Suite aux constatations effectuées, nous avons pris la décision suivante :

DÉCISION : ${decisions[this.actionType] || this.data.decision || 'Décision à préciser'}

${this.data.justification ? `
JUSTIFICATION :
${this.data.justification}
` : ''}

Mesures d'accompagnement :
${this.generateMeasures()}

`;
  }

  generatePhotosSection() {
    if (this.photos.length === 0) {
      return this.config.requiresPhotos ? `
IV. DOCUMENTATION PHOTOGRAPHIQUE

⚠️  ATTENTION : Aucune photo jointe à ce PV
${this.config.requiresPhotos ? 'Photos obligatoires pour ce type d\'action' : 'Photos recommandées'}

` : '';
    }

    const beforePhotos = this.photos.filter(p => p.category === 'before');
    const afterPhotos = this.photos.filter(p => p.category === 'after');
    const otherPhotos = this.photos.filter(p => !['before', 'after'].includes(p.category));

    return `
IV. DOCUMENTATION PHOTOGRAPHIQUE

${beforePhotos.length > 0 ? `
PHOTOS AVANT INTERVENTION (${beforePhotos.length}) :
${beforePhotos.map((photo, index) => `
  ${index + 1}. ${photo.name}
     - Horodatage : ${dayjs(photo.timestamp).format('DD/MM/YYYY HH:mm')}
     - Taille : ${this.formatFileSize(photo.size)}
     - Description : ${photo.description || 'État initial'}
`).join('')}` : ''}

${afterPhotos.length > 0 ? `
PHOTOS APRÈS INTERVENTION (${afterPhotos.length}) :
${afterPhotos.map((photo, index) => `
  ${index + 1}. ${photo.name}
     - Horodatage : ${dayjs(photo.timestamp).format('DD/MM/YYYY HH:mm')}
     - Taille : ${this.formatFileSize(photo.size)}
     - Description : ${photo.description || 'État après intervention'}
`).join('')}` : ''}

${otherPhotos.length > 0 ? `
AUTRES DOCUMENTS PHOTOGRAPHIQUES (${otherPhotos.length}) :
${otherPhotos.map((photo, index) => `
  ${index + 1}. ${photo.name}
     - Horodatage : ${dayjs(photo.timestamp).format('DD/MM/YYYY HH:mm')}
     - Catégorie : ${photo.category}
`).join('')}` : ''}

TOTAL : ${this.photos.length} document(s) photographique(s) joint(s)

`;
  }

  generateMeasures() {
    const measures = {
      DEMOLITION: [
        '• Information des occupants des lieux',
        '• Délai de relogement accordé si nécessaire',
        '• Coordination avec les services sociaux',
        '• Sécurisation de la zone après démolition'
      ],
      SIGNALEMENT: [
        '• Transmission du dossier aux services compétents',
        '• Suivi de l\'évolution de la situation',
        '• Information des autorités locales'
      ],
      NON_DEMOLITION: [
        '• Mise en place d\'un suivi renforcé',
        '• Programmation d\'une nouvelle visite',
        '• Information des services concernés'
      ]
    };

    const actionMeasures = measures[this.actionType] || [];
    return actionMeasures.join('\n') || '• Aucune mesure spécifique';
  }

  generateSignatures() {
    return `
V. SIGNATURES ET VALIDATION

Le présent procès-verbal a été établi contradictoirement en présence de :

┌─────────────────────────────────────┬─────────────────────────────────────┐
│         L'AGENT D'AUTORITÉ          │      LE RESPONSABLE HIÉRARCHIQUE    │
├─────────────────────────────────────┼─────────────────────────────────────┤
│                                     │                                     │
│                                     │                                     │
│                                     │                                     │
│                                     │                                     │
│                                     │                                     │
├─────────────────────────────────────┼─────────────────────────────────────┤
│ ${(this.data.agent.nom || '').padEnd(35)} │ Nom et signature du responsable     │
│ Grade : ${(this.data.agent.grade || '').padEnd(27)} │                                     │
│ Date : ${dayjs(this.data.date).format('DD/MM/YYYY').padEnd(29)} │ Date : _______________              │
└─────────────────────────────────────┴─────────────────────────────────────┘

CACHET OFFICIEL :
┌─────────────────────────┐
│                         │
│     PRÉFECTURE DE       │
│    ${(this.data.prefecture || '').toUpperCase().padEnd(19)} │
│                         │
│   SERVICE TECHNIQUE     │
│                         │
└─────────────────────────┘

Fait à ${this.data.commune}, le ${dayjs(this.data.date).format('DD/MM/YYYY')}

══════════════════════════════════════════════════════════════════

FIN DU PROCÈS-VERBAL N° ${this.data.numerosPV}
`;
  }

  formatCoordinates(coords) {
    if (!coords || coords.length !== 2) return 'Non spécifiées';
    const [lat, lng] = coords;
    return `${Number(lat).toFixed(6)}°N, ${Number(lng).toFixed(6)}°W`;
  }

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  getActionTypeLabel() {
    const labels = {
      DEMOLITION: 'Démolition d\'habitat non réglementaire',
      SIGNALEMENT: 'Signalement d\'infraction',
      NON_DEMOLITION: 'Report de démolition motivé'
    };
    return labels[this.actionType] || this.actionType;
  }

  generateCustomFields() {
    if (!this.customFields || Object.keys(this.customFields).length === 0) return '';
    let content = '\nINFORMATIONS COMPLÉMENTAIRES :\n\n';
    Object.entries(this.customFields).forEach(([section, fields]) => {
      content += `${section.toUpperCase()} :\n`;
      Object.entries(fields).forEach(([key, value]) => {
        content += `• ${key} : ${value}\n`;
      });
      content += '\n';
    });
    return content;
  }

  validatePV() {
    const errors = [];
    if (!this.data.agent?.nom) errors.push('Nom de l\'agent manquant');
    if (!this.data.observations) errors.push('Observations manquantes');
    if (this.config.requiresPhotos && this.photos.length === 0) {
      errors.push('Photos obligatoires manquantes');
    }
    return { isValid: errors.length === 0, errors };
  }

  generate() {
    let content = '';
    if (this.config.sections.includes('header')) content += this.generateHeader();
    if (this.config.sections.includes('context')) content += this.generateContext();
    if (this.config.sections.includes('constatations')) content += this.generateConstatations();
    if (this.config.sections.includes('decision')) content += this.generateDecision();
    if (this.config.sections.includes('justification') && this.data.justification) {
      content += `\nJUSTIFICATION DE LA DÉCISION :\n${this.data.justification}\n`;
    }
    if (this.config.sections.includes('photos')) content += this.generatePhotosSection();
    content += this.generateCustomFields();
    if (this.config.sections.includes('signatures')) content += this.generateSignatures();

    return {
      content,
      metadata: {
        numerosPV: this.data.numerosPV,
        actionType: this.actionType,
        date: this.data.date,
        agent: this.data.agent,
        photoCount: this.photos.length,
        hasPhotos: this.photos.length > 0,
        isComplete: this.validatePV()
      }
    };
  }
}

export const createPV = (actionType, data, photos = []) => {
  return new PVTemplate(actionType)
    .setData(data)
    .setPhotos(photos)
    .generate();
};

export const createDemolitionPV = (data, photos) => {
  return new PVTemplate('DEMOLITION')
    .setData(data)
    .setPhotos(photos)
    .addCustomField('Conditions météo', data.meteo || 'Normales')
    .addCustomField('Présence occupants', data.occupants || 'Non')
    .generate();
};

export const createSignalementPV = (data, photos) => {
  return new PVTemplate('SIGNALEMENT')
    .setData(data)
    .setPhotos(photos)
    .addCustomField('Urgence', data.urgence || 'Normale')
    .generate();
};

export default PVTemplate;
