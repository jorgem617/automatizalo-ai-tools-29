
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import EditableText from '@/components/admin/EditableText';
import { useContactInfo } from '@/stores/contactInfoStore';
import FooterWhatsAppButton from './FooterWhatsAppButton';
import ContactInfoItem from './ContactInfoItem';

const ContactSection = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { contactInfo, updateContactInfo } = useContactInfo();
  
  const handleContactInfoChange = async (id: string, value: string) => {
    const fieldMap: Record<string, keyof typeof contactInfo> = {
      'footer-email': 'email',
      'footer-address': 'address',
      'footer-website': 'website'
    };
    
    if (id in fieldMap) {
      try {
        const field = fieldMap[id];
        const updatedInfo = {
          ...contactInfo,
          [field]: value
        };
        
        await updateContactInfo(updatedInfo);
      } catch (error) {
        console.error("Error updating contact info:", error);
      }
    }
  };
  
  return (
    <div className="md:col-span-4">
      <h3 className={`font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-left`}>
        {isAuthenticated ? (
          <EditableText 
            id="footer-contact-us" 
            defaultText={t("contact.title")}
          />
        ) : (
          t("contact.title")
        )}
      </h3>
      <div className="text-left">
        <FooterWhatsAppButton />
        <ContactInfoItem 
          fieldId="footer-email" 
          label="Email" 
          value={contactInfo.email} 
          onSave={(value) => handleContactInfoChange('footer-email', value)}
        />
        <ContactInfoItem 
          fieldId="footer-address" 
          label="Address" 
          value={contactInfo.address}
          multiline={true} 
          onSave={(value) => handleContactInfoChange('footer-address', value)}
        />
        <ContactInfoItem 
          fieldId="footer-website" 
          label="Website" 
          value={contactInfo.website}
          isLink={true}
          href={contactInfo.website}
          onSave={(value) => handleContactInfoChange('footer-website', value)}
        />
      </div>
    </div>
  );
};

export default ContactSection;
