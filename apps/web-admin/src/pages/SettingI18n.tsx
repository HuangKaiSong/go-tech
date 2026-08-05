import { useMutation } from '@tanstack/react-query';
import { Button, Card, Form, type FormProps, Input } from 'antd';
import { Languages } from 'lucide-react';
import { toast } from 'sonner';

type FieldType = {
  'en-us'?: string;
  hk?: string;
  key: string;
  source: string;
  'zh-cn'?: string;
  'zh-hk'?: string;
};

const RolesPage = () => {
  const [form] = Form.useForm<FieldType>();

  const clearCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/h5-hook/api/translate/clear', {
        method: 'POST'
      });
      return response.json();
    }
  });

  const searchMutation = useMutation({
    mutationFn: async (source: string) => {
      const searchParams = new URLSearchParams({
        value: source
      });

      const uri = `/h5-hook/api/translate/dictionary?${searchParams.toString()}`;
      const response = await fetch(uri, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    onSuccess(data) {
      const response = data.results?.at(0);
      if (!response) {
        toast.info('未匹配到翻译记录');
        return;
      }

      const translations = response.translations ?? {};

      form.setFieldsValue({
        key: response.key,
        source: response.source,
        'en-us': translations['en-us'],
        'zh-cn': translations['zh-cn'],
        'zh-hk': translations['zh-hk']
      });
    },
    onError(error) {
      console.log(error);
      toast.error('查询失败');
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (source: FieldType) => {
      const data = {
        key: source.key,
        source: source.source,
        translations: {
          'zh-hk': source['zh-hk'],
          'zh-cn': source['zh-cn'],
          'en-us': source['en-us'],
          hk: source.hk ?? source['zh-hk']
        }
      };

      const uri = `/h5-hook/api/translate/dictionary`;
      const response = await fetch(uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess(data) {
      const response = data;
      const translations = response.translations;

      form.setFieldsValue({
        key: response.key,
        'en-us': translations['en-us'],
        'zh-cn': translations['zh-cn'],
        'zh-hk': translations['zh-hk']
      });
      // 还需要刷新缓存
      clearCache.mutateAsync();

      toast.success('保存成功');
    },
    onError(error) {
      console.log(error);
      toast.error('保存失败');
    }
  });

  const onFinish: FormProps<FieldType>['onFinish'] = values => {
    submitMutation.mutate(values);
  };

  const handleSearch = (value: string) => {
    let source = value;
    if (!source || !source.length) {
      source = '查看完整的定價方案';
      form.setFieldsValue({ source });
    }

    // 避免上一请求未完成时重复发起
    if (searchMutation.isPending) return;

    searchMutation.mutate(source);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">国际化维护</h1>
        </div>
      </div>

      <Card>
        <Form
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 800 }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label="key"
            name="key"
            hidden
            rules={[{ required: true, message: 'Please input your key!' }]}
          >
            <Input hidden />
          </Form.Item>
          <Form.Item<FieldType>
            label="原文"
            name="source"
            rules={[{ required: true, message: 'Please input your source!' }]}
          >
            <Input.Search placeholder="查看完整的定價方案" onSearch={handleSearch} loading={searchMutation.isPending} />
          </Form.Item>

          <Form.Item<FieldType> label="簡體" name="zh-cn">
            <Input.TextArea placeholder="" />
          </Form.Item>
          <Form.Item<FieldType> label="繁體" name="zh-hk">
            <Input.TextArea placeholder="" />
          </Form.Item>
          <Form.Item<FieldType> label="英文" name="en-us">
            <Input.TextArea placeholder="" />
          </Form.Item>

          <Form.Item label={null}>
            <Button type="primary" htmlType="submit" loading={submitMutation.isPending}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RolesPage;
