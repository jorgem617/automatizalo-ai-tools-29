
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Code, Loader2, Save } from 'lucide-react';
import type { Integration } from '@/types/automation';

interface CodeIntegrationProps {
  data: Integration;
  type: 'form' | 'table' | 'custom_prompt'; // Added custom_prompt to supported types
  title: string;
  description: string;
  placeholder: string;
  icon: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCodeChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const CodeIntegration: React.FC<CodeIntegrationProps> = ({
  data,
  type,
  title,
  description,
  placeholder,
  icon,
  onChange,
  onCodeChange,
  onSave,
  isSaving
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`${type}-code`}>
            {type === 'custom_prompt' ? 'Prompt Template' : 'Embed Code'}
          </Label>
          <div className="flex items-center space-x-2 mb-2">
            <Code className="h-4 w-4 text-gray-500" />
            <p className="text-sm text-gray-500">
              {type === 'custom_prompt' 
                ? 'Enter the prompt template for this automation' 
                : 'Paste the HTML code for your integration'}
            </p>
          </div>
          <Textarea 
            id={`${type}-code`}
            placeholder={placeholder}
            rows={10}
            value={type === 'custom_prompt' ? (data?.prompt_text || '') : (data?.integration_code || '')}
            onChange={(e) => {
              if (onChange) onChange(e);
              onCodeChange(e.target.value);
            }}
            className="font-mono text-sm"
          />
        </div>
        
        {type !== 'custom_prompt' && data?.integration_code && (
          <div>
            <Label>Preview</Label>
            <div className="mt-2 border rounded-md p-4 bg-gray-50">
              <div dangerouslySetInnerHTML={{ __html: data.integration_code }} />
            </div>
          </div>
        )}
        
        <Button 
          onClick={onSave} 
          disabled={isSaving} 
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save {title}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CodeIntegration;
