import { Tabs, Tree, Typography, Empty, Button, Dropdown } from 'antd'
import type { TreeDataNode, MenuProps } from 'antd'
import {
  AppstoreOutlined,
  ApartmentOutlined,
  SettingOutlined,
  DatabaseOutlined,
  RocketOutlined,
  RobotOutlined,
  RadarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  MoreOutlined,
  BorderOutlined,
  ArrowRightOutlined,
  LineOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useEditor, CanvasElement } from '../../context/EditorContext'
import styles from './index.module.less'

const { Title } = Typography

interface ComponentItem {
  key: string
  label: string
  icon?: React.ReactNode
}

interface ComponentGroup {
  key: string
  label: string
  icon: React.ReactNode
  items: ComponentItem[]
}

const Toolbox = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  const { elements, selectedElementId, selectElement, deleteElement, addElement } = useEditor()

  // 组件分组数据
  const componentGroups: ComponentGroup[] = [
    {
      key: 'industrial',
      label: t('editor.componentGroups.industrial'),
      icon: <SettingOutlined />,
      items: [
        { key: 'pump', label: '泵' },
        { key: 'valve', label: '阀门' },
        { key: 'tank', label: '储罐' },
        { key: 'pipe', label: '管道' },
        { key: 'reactor', label: '反应器' },
        { key: 'heat-exchanger', label: '换热器' }
      ]
    },
    {
      key: 'aerospace',
      label: t('editor.componentGroups.aerospace'),
      icon: <RocketOutlined />,
      items: [
        { key: 'satellite', label: '卫星' },
        { key: 'rocket', label: '火箭' },
        { key: 'antenna', label: '天线' },
        { key: 'solar-panel', label: '太阳能板' },
        { key: 'thruster', label: '推进器' }
      ]
    },
    {
      key: 'automation',
      label: t('editor.componentGroups.automation'),
      icon: <RobotOutlined />,
      items: [
        { key: 'motor', label: '电机' },
        { key: 'conveyor', label: '传送带' },
        { key: 'robot-arm', label: '机械臂' },
        { key: 'controller', label: '控制器' }
      ]
    },
    {
      key: 'sensors',
      label: t('editor.componentGroups.sensors'),
      icon: <RadarChartOutlined />,
      items: [
        { key: 'temperature-sensor', label: '温度传感器' },
        { key: 'pressure-sensor', label: '压力传感器' },
        { key: 'flow-sensor', label: '流量传感器' },
        { key: 'level-sensor', label: '液位传感器' }
      ]
    }
  ]

  // 将画布元素转换为树形结构数据
  const convertElementsToTreeData = (elements: CanvasElement[]): TreeDataNode[] => {
    return elements.map((element) => {
      const getIcon = () => {
        switch (element.type) {
          case 'rect':
            return <BorderOutlined />
          case 'circle':
            return <div className={styles.circleIcon} />
          case 'polygon':
            return <div className={styles.polygonIcon} />
          case 'arrow':
            return <ArrowRightOutlined />
          case 'line':
            return <LineOutlined />
          case 'text':
            return <FileTextOutlined />
          case 'component':
            return <DatabaseOutlined />
          default:
            return <DatabaseOutlined />
        }
      }

      const menuItems: MenuProps['items'] = [
        {
          key: 'edit',
          label: t('common.edit'),
          icon: <EditOutlined />
        },
        {
          key: 'copy',
          label: t('common.copy'),
          icon: <CopyOutlined />
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          label: t('common.delete'),
          icon: <DeleteOutlined />,
          danger: true
        }
      ]

      const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'delete') {
          deleteElement(element.id)
        } else if (key === 'copy') {
          addElement({
            ...element,
            name: `${element.name} (副本)`,
            x: element.x + 20,
            y: element.y + 20
          })
        }
      }

      return {
        title: (
          <div className={styles.treeNodeTitle}>
            <span className={styles.treeNodeContent}>
              {getIcon()}
              <span className={styles.treeNodeLabel}>{element.name || element.type}</span>
            </span>
            <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
                className={styles.treeNodeAction}
              />
            </Dropdown>
          </div>
        ),
        key: element.id,
        children: element.children ? convertElementsToTreeData(element.children) : undefined,
        isLeaf: !element.children || element.children.length === 0
      }
    })
  }

  const treeData: TreeDataNode[] = convertElementsToTreeData(elements)

  // 组件列表渲染
  const renderComponents = () => {
    return (
      <div className={styles.componentsContent}>
        {componentGroups.map((group) => (
          <div key={group.key} className={styles.componentGroup}>
            <div className={styles.groupHeader}>
              {group.icon}
              <Title level={5} className={styles.groupTitle}>
                {group.label}
              </Title>
            </div>
            <div className={styles.groupItems}>
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className={styles.componentItem}
                  onClick={() => handleComponentClick(`${group.key}-${item.key}`, item.label)}
                  title={item.label}
                >
                  <div className={styles.componentIcon}>
                    <DatabaseOutlined />
                  </div>
                  <div className={styles.componentLabel}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 树形结构渲染 - 显示画布元素层级
  const renderTree = () => {
    if (elements.length === 0) {
      return (
        <div className={styles.treeContent}>
          <Empty
            description={t('editor.tree.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        </div>
      )
    }

    return (
      <div className={styles.treeContent}>
        <Tree
          treeData={treeData}
          selectedKeys={selectedElementId ? [selectedElementId] : []}
          defaultExpandAll
          showIcon
          onSelect={(selectedKeys) => {
            if (selectedKeys.length > 0) {
              selectElement(selectedKeys[0] as string)
            } else {
              selectElement(null)
            }
          }}
          blockNode
        />
      </div>
    )
  }

  const handleComponentClick = (key: string, label: string) => {
    console.log('Add component:', key, label)
    // TODO: 实现添加组件逻辑
  }

  const tabItems = [
    {
      key: 'components',
      label: (
        <span>
          <AppstoreOutlined />
          {t('editor.components')}
        </span>
      ),
      children: renderComponents()
    },
    {
      key: 'tree',
      label: (
        <span>
          <ApartmentOutlined />
          {t('editor.tree.label')}
        </span>
      ),
      children: renderTree()
    }
  ]

  return (
    <div className={`${styles.toolbox} ${className || ''}`}>
      <Tabs defaultActiveKey="components" items={tabItems} className={styles.tabs} size="small" />
    </div>
  )
}

export default Toolbox
