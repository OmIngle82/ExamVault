'use client';

import { useState, useRef } from 'react';
import { Award, PenTool, Eye } from 'lucide-react';
import styles from './certificate.module.css';

interface CertificateSettings {
    enabled: boolean;
    issuer: string;
    title: string;
    signatureTitle: string;
    minScore: number;
}

interface CertificateEditorProps {
    settings: CertificateSettings;
    onChange: (settings: CertificateSettings) => void;
}

export default function CertificateEditor({ settings, onChange }: CertificateEditorProps) {
    const handleChange = (field: keyof CertificateSettings, value: any) => {
        onChange({ ...settings, [field]: value });
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.controls}>
                <label className={styles.toggle}>
                    <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => handleChange('enabled', e.target.checked)}
                    />
                    <span className={styles.toggleLabel}>Enable Certificate</span>
                </label>

                {settings.enabled && (
                    <div className={styles.inputs}>
                        <label>
                            Issuer Name
                            <input
                                type="text"
                                value={settings.issuer}
                                onChange={(e) => handleChange('issuer', e.target.value)}
                                placeholder="e.g. ExamVault Academy"
                            />
                        </label>
                        <label>
                            Certificate Title
                            <input
                                type="text"
                                value={settings.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Certificate of Completion"
                            />
                        </label>
                        <label>
                            Signature Title
                            <input
                                type="text"
                                value={settings.signatureTitle}
                                onChange={(e) => handleChange('signatureTitle', e.target.value)}
                                placeholder="Instructor"
                            />
                        </label>
                        <label>
                            Min Score % to Pass
                            <input
                                type="number"
                                value={settings.minScore}
                                onChange={(e) => handleChange('minScore', parseInt(e.target.value))}
                            />
                        </label>
                    </div>
                )}
            </div>

            {settings.enabled && (
                <div className={styles.preview}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Eye size={18} /> Live Preview
                    </h3>

                    {/* Certificate Preview Box */}
                    <div className={styles.certPaper}>
                        <div className={styles.watermark}>Pass</div>
                        <div className={styles.border}>
                            <div className={styles.header}>
                                <Award size={48} color="#D97706" />
                                <h1>{settings.title || 'Certificate of Completion'}</h1>
                            </div>

                            <p className={styles.bodyText}>This is to certify that</p>
                            <h2 className={styles.studentName}>Student Name</h2>
                            <p className={styles.bodyText}>has successfully passed the exam</p>
                            <h3 className={styles.courseName}>History of Physics</h3>

                            <p className={styles.date}>Date: {new Date().toLocaleDateString()}</p>

                            <div className={styles.footer}>
                                <div className={styles.signature}>
                                    <div className={styles.sigLine}></div>
                                    <p>{settings.issuer || 'Issuer'}</p>
                                    <small>{settings.signatureTitle || 'Instructor'}</small>
                                </div>
                                <div className={styles.seal}>
                                    Valid
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
