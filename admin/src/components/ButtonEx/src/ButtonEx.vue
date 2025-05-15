<script lang="tsx">
  import { omit } from 'lodash-es';
  import { computed, unref, defineComponent } from 'vue';
  import { ElButton, buttonProps, buttonEmits, Placement, ElTooltip } from 'element-plus';
  import { useAttrs } from '@/hooks/core/useAttrs';
  import Icon from '@/components/Icon';

  const PROP_CONTENT = 'content';
  const PROP_PLACEMENT = 'placement';
  const PROP_ICON = 'icon';

  export default defineComponent({
    name: 'XButton',
    extends: ElButton,
    inheritAttrs: false,
    props: {
      ...buttonProps,
      content: { type: String, default: '' },
      placement: { type: String as PropType<Placement>, default: 'top' },
    },
    emits: buttonEmits,
    setup(props, { slots }) {
      const attrs = useAttrs({ excludeDefaultKeys: false });
      const getBindValue = computed(() =>
        omit({ ...unref(attrs), ...props }, [PROP_CONTENT, PROP_PLACEMENT, PROP_ICON]),
      );

      const renderButton = () => {
        return (
          <ElButton
            {...unref(getBindValue)}
          >
            {{
              ...slots,
              default: () =>
                props[PROP_ICON] ? (
                  <>
                    <Icon icon={props[PROP_ICON]} />
                    {slots.default && <span>{slots.default()}</span>}
                  </>
                ) : (
                  slots.default && slots.default()
                ),
            }}
          </ElButton>
        );
      };

      return () =>
        props.content ? (
          <ElTooltip content={props.content} placement={props.placement} auto-close={5000}>
            {renderButton}
          </ElTooltip>
        ) : (
          renderButton()
        );
    },
  });
</script>
