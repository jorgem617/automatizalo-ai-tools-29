
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import ContentHeader from '@/components/admin/content/ContentHeader';
import ContentLoading from '@/components/admin/content/ContentLoading';
import ContentEditorTabs from '@/components/admin/content/ContentEditorTabs';
import { useContentEditor } from '@/hooks/useContentEditor';

const ContentEditor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    content,
    images,
    loading,
    uploadingImage,
    setUploadingImage,
    pageSections,
    handleContentUpdate,
    handleSaveContent,
  } = useContentEditor();

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/admin/content-editor');
    }
  }, [user, navigate]);

  if (!user) {
    return <ContentLoading />;
  }

  if (loading) {
    return <ContentLoading />;
  }

  return (
    <div className="container mx-auto px-0 sm:px-4">
      <ContentHeader />

      <ContentEditorTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pageSections={pageSections}
        content={content}
        images={images}
        handleContentUpdate={handleContentUpdate}
        handleSaveContent={handleSaveContent}
        uploadingImage={uploadingImage}
        setUploadingImage={setUploadingImage}
      />
    </div>
  );
};

export default ContentEditor;
