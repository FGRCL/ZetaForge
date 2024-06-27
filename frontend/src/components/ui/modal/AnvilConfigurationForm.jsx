import {
  TextInput,
  NumberInput,
  Stack,
  Section,
  Heading,
  Button,
  PasswordInput,
} from "@carbon/react";
import { useState } from "react";
import { useAtom } from "jotai";
import {
  addConfigurationAtom,
  defaultAnvilConfigurationAtom,
} from "@/atoms/anvilConfigurationsAtom";

export default function AnvilConfigurationForm({
  onClose,
  initialConfiguration,
}) {
  const [defaultConfig] = useAtom(defaultAnvilConfigurationAtom);
  const [, addConfig] = useAtom(addConfigurationAtom);

  const [configForm, setConfigForm] = useState(
    initialConfiguration ?? {
      name: "",
      anvilHost: "",
      anvilPort: "",
      s3Host: "",
      s3Port: "",
      s3Region: "",
      s3Bucket: "",
      s3AccessKeyId: "",
      s3SecretAccessKey: "",
    },
  );

  function handleInputChange(e) {
    const { name, value } = e.target;
    setConfigForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSave() {
    addConfig({
      name: configForm.name,
      anvil: {
        host: configForm.anvilHost,
        port: configForm.anvilport,
      },
      s3: {
        host: configForm.s3Host,
        port: configForm.s3Port,
        region: configForm.s3Region,
        bucket: configForm.s3Bucket,
        accessKeyId: configForm.s3AccessKeyId,
        secretAccessKey: configForm.s3SecretAccessKey,
      },
    });
    onClose();
  }

  function handleCancel() {
    onClose();
  }

  return (
    <Stack gap={7}>
      <TextInput
        labelText="Name"
        placeholder={defaultConfig.name}
        name="name"
        value={configForm.name}
        onChange={handleInputChange}
      />

      <Section level={5}>
        <Heading>Anvil</Heading>
        <Stack gap={5}>
          <TextInput
            labelText="Host"
            placeholder={defaultConfig.anvil.host}
            name="anvilHost"
            value={configForm.anvilHost}
            onChange={handleInputChange}
          />
          <NumberInput
            label="Port"
            placeholder={defaultConfig.anvil.port}
            allowEmpty
            hideSteppers
            min={0}
            max={65535}
            name="anvilPort"
            value={configForm.anvilPort}
            onChange={handleInputChange}
          />
        </Stack>
      </Section>

      <Section level={5}>
        <Stack gap={5}>
          <Heading>S3</Heading>
          <TextInput
            labelText="Host"
            placeholder={defaultConfig.s3.host}
            name="s3Host"
            value={configForm.s3Host}
            onChange={handleInputChange}
          />
          <NumberInput
            label="Port"
            placeholder={defaultConfig.s3.port}
            allowEmpty
            hideSteppers
            min={0}
            max={65535}
            name="s3Port"
            value={configForm.s3Port}
            onChange={handleInputChange}
          />
          <TextInput
            labelText="Region"
            placeholder={defaultConfig.s3.region}
            name="s3Region"
            value={configForm.s3Region}
            onChange={handleInputChange}
          />
          <TextInput
            labelText="Bucket"
            placeholder={defaultConfig.s3.bucket}
            name="s3Bucket"
            value={configForm.s3Bucket}
            onChange={handleInputChange}
          />
          <PasswordInput
            labelText="Access Key ID"
            placeholder={defaultConfig.s3.accessKeyId}
            name="s3AccessKeyId"
            value={configForm.s3AccessKeyId}
            onChange={handleInputChange}
          />
          <PasswordInput
            labelText="Secret Access Key"
            placeholder={defaultConfig.s3.secretAccessKey}
            name="s3SecretAccessKey"
            value={configForm.s3SecretAccessKey}
            onChange={handleInputChange}
          />
        </Stack>
      </Section>
      <div className="flex justify-between">
        <Button
          iconDescription="Cancel"
          tooltipAlignment="end"
          kind="secondary"
          size="md"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          iconDescription="Add"
          tooltipAlignment="end"
          kind="primary"
          size="md"
          onClick={handleSave}
        >
          Add
        </Button>
      </div>
    </Stack>
  );
}

