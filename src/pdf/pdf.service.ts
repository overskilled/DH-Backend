import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
    async generateInvoicePdf(invoice: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                margin: 40,
                size: 'A4',
                bufferPages: true,
                autoFirstPage: true
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ============================================================
            // PAGE HEADER
            // ============================================================

            doc.fontSize(20)
                .font('Helvetica-Bold')
                .fillColor('#000')
                .text('DHAVOCATS', 40, 40);

            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#666')
                .text("Cabinet d'Avocats", 40, 65);

            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor('#1e40af')
                .text('FACTURE', 400, 40, { 
                    align: 'right',
                    width: 150 
                });

            this.drawLine(doc, 40, 90);

            // ============================================================
            // INVOICE & CLIENT INFO
            // ============================================================

            const top = 110;
            const client = invoice.client || {};

            doc.fontSize(10).font('Helvetica').fillColor('#000');
            doc.text(`Référence: ${invoice.reference}`, 40, top);
            doc.text(`Date d'émission: ${this.formatDate(invoice.issueDate)}`, 40, top + 15);
            doc.text(`Date d'échéance: ${this.formatDate(invoice.dueDate)}`, 40, top + 30);

            // CLIENT INFO - à droite
            const clientX = 400;
            doc.font('Helvetica-Bold').fontSize(11).text('Client', clientX, top, { align: 'right' });
            
            let clientY = top + 20;
            if (client.name) {
                doc.font('Helvetica').fontSize(10).text(client.name, clientX, clientY, { align: 'right' });
                clientY += 15;
            }
            if (client.companyName) {
                doc.text(client.companyName, clientX, clientY, { align: 'right' });
                clientY += 15;
            }
            if (client.email) {
                doc.text(client.email, clientX, clientY, { align: 'right' });
                clientY += 15;
            }
            if (client.phone) {
                doc.text(client.phone, clientX, clientY, { align: 'right' });
                clientY += 15;
            }

            // ============================================================
            // TABLE
            // ============================================================
            
            // Calculer la position de départ du tableau en fonction du contenu client
            const tableTop = Math.max(top + 90, clientY + 10);

            // Définir des positions de colonnes avec plus d'espace
            const colDescription = 40;    // Largeur: 180px
            const colCollaborateur = 230; // Largeur: 110px  
            const colHeures = 360;       // Largeur: 50px
            const colMontant = 420;      // Largeur: 120px (plus large pour éviter les débordements)

            // En-têtes du tableau
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
            
            // Description - avec largeur fixe
            doc.text('Description', colDescription, tableTop, { 
                width: 180 
            });
            
            // Collaborateur - avec largeur fixe
            doc.text('Collaborateur', colCollaborateur, tableTop, { 
                width: 110 
            });
            
            // Heures - centré
            doc.text('Heures', colHeures, tableTop, { 
                width: 50,
                align: 'center' 
            });
            
            // Montant - aligné à droite avec largeur fixe
            doc.text('Montant', colMontant, tableTop, { 
                width: 120,
                align: 'right' 
            });

            this.drawLine(doc, 40, tableTop + 15);

            // ============================================================
            // LIGNES DU TABLEAU
            // ============================================================

            let y = tableTop + 30;
            let subtotal = 0;
            const entries = invoice.timeEntries || [];

            // Pour chaque entrée
            entries.forEach((entry: any) => {
                const description = entry.description || entry.task?.list?.name || 'Prestation';
                const collaborator = entry.collaborator
                    ? `${entry.collaborator.firstName} ${entry.collaborator.lastName}`
                    : 'Non spécifié';

                const hours = parseFloat(entry.hoursSpent || 0).toFixed(2);
                const rate = parseFloat(entry.collaborator?.pricingPerHour || 0);
                const amount = parseFloat(hours) * rate;
                subtotal += amount;

                doc.fontSize(9).font('Helvetica').fillColor('#000');

                // Description (tronquer si trop long)
                const shortDesc = this.truncateText(description, 25);
                doc.text(shortDesc, colDescription, y, { 
                    width: 180 
                });

                // Collaborateur (tronquer si trop long)
                const shortCollab = this.truncateText(collaborator, 15);
                doc.text(shortCollab, colCollaborateur, y, { 
                    width: 110 
                });

                // Heures (centré)
                doc.text(hours, colHeures, y, { 
                    width: 50,
                    align: 'center' 
                });

                // Montant (avec formatage correct et alignement à droite)
                const formattedAmount = this.formatCurrencyProperly(amount);
                doc.text(formattedAmount, colMontant, y, { 
                    width: 120,
                    align: 'right' 
                });

                y += 20;
            });

            this.drawLine(doc, 40, y);

            // ============================================================
            // TOTAUX - AVEC ESPACE GARANTI
            // ============================================================

            const summaryTop = y + 25;
            const taxRate = invoice.taxRate || 19.25;
            const tax = subtotal * (taxRate / 100);
            const total = subtotal + tax;

            // Zone dédiée pour les totaux (pas de superposition possible)
            const totalZoneX = 350; // Commence plus à gauche
            const totalZoneWidth = 200; // Largeur fixe pour toute la zone

            // Sous-total
            doc.fontSize(10).font('Helvetica').fillColor('#000');
            doc.text('Sous-total :', totalZoneX, summaryTop, { 
                width: 80,
                align: 'right' 
            });
            
            const subtotalText = this.formatCurrencyProperly(subtotal);
            doc.text(subtotalText, totalZoneX + 90, summaryTop, { 
                width: 100,
                align: 'right' 
            });

            // TVA
            doc.text(`TVA (${taxRate}%) :`, totalZoneX, summaryTop + 20, { 
                width: 80,
                align: 'right' 
            });
            
            const taxText = this.formatCurrencyProperly(tax);
            doc.text(taxText, totalZoneX + 90, summaryTop + 20, { 
                width: 100,
                align: 'right' 
            });

            // Total (en gras)
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Total :', totalZoneX, summaryTop + 40, { 
                width: 80,
                align: 'right' 
            });
            
            const totalText = this.formatCurrencyProperly(total);
            doc.text(totalText, totalZoneX + 90, summaryTop + 40, { 
                width: 100,
                align: 'right' 
            });

            // Ligne de séparation
            const separateLineTop = summaryTop + 70;
            this.drawLine(doc, 40, separateLineTop);

            // ============================================================
            // STATUT
            // ============================================================

            const statusTop = separateLineTop + 20;
            const status = invoice.paid ? 'PAYÉE' : 'EN ATTENTE';
            const color = invoice.paid ? '#10b981' : '#f59e0b';

            doc.fontSize(11).font('Helvetica-Bold').fillColor(color);
            doc.text(`STATUT: ${status}`, 40, statusTop, { 
                width: 200 
            });

            // ============================================================
            // PAYMENT INFO
            // ============================================================

            const paymentTop = statusTop + 30;

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
            doc.text('Informations de paiement :', 40, paymentTop, { 
                width: 200 
            });

            doc.font('Helvetica').fontSize(9).fillColor('#666');
            doc.text('Banque: DHAVOCATS BANK', 40, paymentTop + 15, { 
                width: 300 
            });
            doc.text('IBAN: CM23 0000 0000 0000 0000 0000', 40, paymentTop + 30, { 
                width: 400 
            });
            doc.text('SWIFT: DHCMCMCX', 40, paymentTop + 45, { 
                width: 300 
            });

            // ============================================================
            // NOTES
            // ============================================================

            if (invoice.notes) {
                const notesTop = paymentTop + 70;

                doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
                doc.text('Notes :', 40, notesTop, { 
                    width: 100 
                });

                doc.font('Helvetica').fontSize(9).fillColor('#666');
                // Diviser les notes en lignes si trop longues
                const noteLines = this.splitTextIntoLines(invoice.notes, 80);
                noteLines.forEach((line, index) => {
                    doc.text(line, 40, notesTop + 15 + (index * 12), { 
                        width: 500 
                    });
                });
            }

            // ============================================================
            // FOOTER
            // ============================================================

            const footerY = 760;

            this.drawLine(doc, 40, footerY);

            doc.fontSize(8).fillColor('#999');
            doc.text("DHAVOCATS - Cabinet d'Avocats", 40, footerY + 10, { 
                width: 300 
            });
            doc.text('contact@dhavocats.com - +237 6 XX XX XX XX', 40, footerY + 25, { 
                width: 350 
            });

            doc.end();
        });
    }

    // ============================================================
    // HELPERS AMÉLIORÉS
    // ============================================================

    /**
     * Formatage correct des montants sans "/"
     */
    private formatCurrencyProperly(amount: number): string {
        const rounded = Math.round(amount);
        // Utiliser des espaces comme séparateurs de milliers (format français)
        const formatted = rounded.toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        return `${formatted} FCFA`;
    }

    /**
     * Tronquer le texte si trop long
     */
    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Diviser un texte long en plusieurs lignes
     */
    private splitTextIntoLines(text: string, maxLineLength: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxLineLength) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    private formatDate(date: string): string {
        return new Date(date).toLocaleDateString('fr-FR');
    }

    private drawLine(doc: any, x: number, y: number) {
        doc.moveTo(x, y)
            .lineTo(555, y)
            .strokeColor('#cccccc')
            .lineWidth(1)
            .stroke();
    }
}